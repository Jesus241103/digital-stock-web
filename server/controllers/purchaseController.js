/**
 * Controlador de Compras (Entradas de Inventario)
 * Digital Stock Web
 * 
 * Gestión de compras a proveedores
 */

const { query, pool } = require('../config/database');
const { logAction } = require('./logController');
const { createInvoicePDF } = require('../utils/pdfGenerator');
const { sendInvoice } = require('../utils/email');

/**
 * Obtener todas las compras
 * GET /api/purchases
 */
async function getAll(req, res) {
    try {
        const { mes, limit } = req.query;

        let sql = `
            SELECT cf.id, cf.cedula as proveedor_codigo, p.nombre as proveedor_nombre,
                   cf.fecha, cf.hora, cf.monto
            FROM cab_factura cf
            LEFT JOIN proveedor p ON cf.cedula = p.codigo
        `;
        const params = [];

        if (mes) {
            sql += ' WHERE MONTH(cf.fecha) = ?';
            params.push(mes);
        }

        sql += ' ORDER BY cf.id DESC';

        if (limit) {
            sql += ' LIMIT ?';
            params.push(parseInt(limit));
        }

        const purchases = await query(sql, params);

        res.json({
            success: true,
            data: purchases,
            count: purchases.length
        });

    } catch (error) {
        console.error('Error al obtener compras:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener compras'
        });
    }
}

/**
 * Obtener una compra con sus detalles
 * GET /api/purchases/:id
 */
async function getById(req, res) {
    try {
        const { id } = req.params;

        // Obtener cabecera
        const headers = await query(
            `SELECT cf.*, p.nombre as proveedor_nombre 
             FROM cab_factura cf
             LEFT JOIN proveedor p ON cf.cedula = p.codigo
             WHERE cf.id = ?`,
            [id]
        );

        if (headers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Compra no encontrada'
            });
        }

        // Obtener detalles
        const details = await query(
            'SELECT * FROM detalle_fac WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            data: {
                cabecera: headers[0],
                detalles: details
            }
        });

    } catch (error) {
        console.error('Error al obtener compra:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener compra'
        });
    }
}

/**
 * Registrar nueva compra
 * POST /api/purchases
 * Body: { proveedor_cedula, productos: [{ codigo, cantidad }] }
 */
async function create(req, res) {
    const connection = await pool.getConnection();

    try {
        // Aceptar ambos formatos: proveedor_cedula o cedula, productos o detalles
        const proveedor_cedula = req.body.proveedor_cedula || req.body.cedula;
        const productos = req.body.productos || req.body.detalles || [];

        if (!proveedor_cedula) {
            return res.status(400).json({
                success: false,
                message: 'El proveedor es requerido'
            });
        }

        if (!productos || productos.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Debe incluir al menos un producto'
            });
        }

        await connection.beginTransaction();

        // Calcular monto total
        let montoTotal = 0;
        let accumSubtotal = 0;
        let accumIva = 0;
        const productDetails = [];

        for (const item of productos) {
            // Aceptar 'codigo' o 'codigo_producto'
            const codigoProducto = item.codigo || item.codigo_producto;

            // Obtener datos del producto
            const [prods] = await connection.execute(
                'SELECT codigo, nombre, precio, iva FROM producto WHERE codigo = ? AND estado = 1',
                [codigoProducto]
            );

            if (prods.length === 0) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: `Producto ${codigoProducto} no encontrado o inactivo`
                });
            }

            const prod = prods[0];
            const subtotal = prod.precio * item.cantidad;
            const ivaAmount = subtotal * (prod.iva / 100);

            accumSubtotal += subtotal;
            accumIva += ivaAmount;
            montoTotal += subtotal + ivaAmount;

            productDetails.push({
                codigo_producto: prod.codigo,
                nombre: prod.nombre,
                precio: prod.precio,
                iva: prod.iva,
                cantidad: item.cantidad
            });
        }

        // Obtener fecha y hora actual
        const now = new Date();
        const fecha = now.toISOString().split('T')[0];
        const hora = now.toTimeString().split(' ')[0];

        // Insertar cabecera
        const [headerResult] = await connection.execute(
            'INSERT INTO cab_factura (cedula, fecha, hora, monto) VALUES (?, ?, ?, ?)',
            [proveedor_cedula, fecha, hora, montoTotal]
        );

        const facturaId = headerResult.insertId;

        // Insertar detalles y actualizar stock
        for (const detail of productDetails) {
            await connection.execute(
                `INSERT INTO detalle_fac (id, codigo_producto, nombre, precio, iva, cantidad) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [facturaId, detail.codigo_producto, detail.nombre, detail.precio, detail.iva, detail.cantidad]
            );

            // Aumentar stock
            await connection.execute(
                'UPDATE producto SET cantidad = cantidad + ? WHERE codigo = ?',
                [detail.cantidad, detail.codigo_producto]
            );
        }

        // Obtener datos del proveedor ANTES del commit (para respuesta y email)
        const [providerQuery] = await connection.execute('SELECT * FROM proveedor WHERE codigo = ?', [proveedor_cedula]);
        const providerData = providerQuery[0];

        await connection.commit();

        // Registrar en bitácora
        if (req.user) {
            await logAction(req.user.cedula, req.user.nombre, 'Registro una Entrada.');
        }

        // ----------------------------------------------------
        // ENVIO DE CORREO ASINCRONO (Fuera de la transacción)
        // ----------------------------------------------------
        (async () => {
            try {
                // Datos obtenidos del scope superior

                if (providerData) {
                    const purchaseData = {
                        id: facturaId,
                        fecha: fecha,
                        hora: hora,
                        monto: montoTotal,
                        entidad: providerData, // Datos del proveedor
                        detalles: productDetails
                    };

                    const emailDestino = providerData.email;
                    if (emailDestino && emailDestino.includes('@')) {
                        console.log(`Generando PDF y enviando comprobante de compra ${facturaId} a ${emailDestino}...`);
                        const pdfBuffer = await createInvoicePDF(purchaseData, 'Compra');

                        await sendInvoice(
                            emailDestino,
                            `Comprobante de Recepción #${facturaId} - Digital Stock`,
                            `<h1>Recepción de Mercancía</h1><p>Hemos procesado la recepción de mercancía (Orden #${facturaId}).</p><p>Adjuntamos el comprobante de la operación.</p>`,
                            pdfBuffer,
                            `Comprobante_Compra_${facturaId}.pdf`
                        );
                    } else {
                        console.warn(`Proveedor ${proveedor_cedula} no tiene email válido en campo dirección.`);
                    }
                }
            } catch (emailErr) {
                console.error('Error background enviando email compra:', emailErr);
            }
        })();

        res.status(201).json({
            success: true,
            message: 'Compra registrada exitosamente',
            data: {
                id: facturaId,
                monto: montoTotal,
                subtotal: accumSubtotal,
                iva: accumIva,
                fecha: fecha,
                hora: hora,
                proveedor: providerData,
                detalles: productDetails
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error al registrar compra:', error);
        res.status(500).json({
            success: false,
            message: 'Error al registrar compra'
        });
    } finally {
        connection.release();
    }
}

/**
 * Contar compras
 * GET /api/purchases/count
 */
async function count(req, res) {
    try {
        const result = await query('SELECT COUNT(*) as total FROM cab_factura');

        res.json({
            success: true,
            count: result[0].total
        });

    } catch (error) {
        console.error('Error al contar compras:', error);
        res.status(500).json({
            success: false,
            message: 'Error al contar compras'
        });
    }
}

module.exports = {
    getAll,
    getById,
    create,
    count
};
