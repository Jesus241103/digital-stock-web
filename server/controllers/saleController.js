/**
 * Controlador de Ventas (Salidas de Inventario)
 * Digital Stock Web
 * 
 * Gestión de ventas a clientes
 */

const { query, pool } = require('../config/database');
const { logAction } = require('./logController');
const { createInvoicePDF } = require('../utils/pdfGenerator');
const { sendInvoice } = require('../utils/email');

/**
 * Obtener todas las ventas
 * GET /api/sales
 */
async function getAll(req, res) {
    try {
        const { mes, limit, search } = req.query;

        let sql = `
            SELECT cs.id, cs.cedula as cliente_cedula, c.nombre as cliente_nombre,
                   cs.fecha, cs.hora, cs.monto
            FROM cab_salida cs
            LEFT JOIN cliente c ON cs.cedula = c.cedula
        `;
        const params = [];
        const conditions = [];

        if (mes) {
            conditions.push('MONTH(cs.fecha) = ?');
            params.push(mes);
        }

        if (search) {
            conditions.push('(cs.id LIKE ? OR cs.cedula LIKE ? OR c.nombre LIKE ?)');
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY cs.id DESC';

        if (limit && !isNaN(parseInt(limit))) {
            sql += ' LIMIT ?';
            params.push(parseInt(limit));
        }

        const sales = await query(sql, params);

        res.json({
            success: true,
            data: sales,
            count: sales.length
        });

    } catch (error) {
        console.error('Error al obtener ventas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener ventas'
        });
    }
}

/**
 * Obtener una venta con sus detalles
 * GET /api/sales/:id
 */
async function getById(req, res) {
    try {
        const { id } = req.params;

        // Obtener cabecera
        const headers = await query(
            `SELECT cs.*, c.nombre as cliente_nombre, c.telefono as cliente_telefono
             FROM cab_salida cs
             LEFT JOIN cliente c ON cs.cedula = c.cedula
             WHERE cs.id = ?`,
            [id]
        );

        if (headers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Venta no encontrada'
            });
        }

        // Obtener detalles
        const details = await query(
            'SELECT * FROM detalle_salida WHERE id = ?',
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
        console.error('Error al obtener venta:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener venta'
        });
    }
}

/**
 * Registrar nueva venta
 * POST /api/sales
 * Body: { cliente_cedula, productos: [{ codigo, cantidad }] }
 */
async function create(req, res) {
    const connection = await pool.getConnection();

    try {
        // Aceptar ambos formatos: cliente_cedula o cedula, productos o detalles
        const cliente_cedula = req.body.cliente_cedula || req.body.cedula;
        const productos = req.body.productos || req.body.detalles || [];

        if (!cliente_cedula) {
            return res.status(400).json({
                success: false,
                message: 'El cliente es requerido'
            });
        }

        if (!productos || productos.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Debe incluir al menos un producto'
            });
        }

        await connection.beginTransaction();

        // Calcular monto total y validar stock
        let montoTotal = 0;
        let accumSubtotal = 0;
        let accumIva = 0;
        const productDetails = [];

        for (const item of productos) {
            // Aceptar 'codigo' o 'codigo_producto'
            const codigoProducto = item.codigo || item.codigo_producto;

            // Obtener datos del producto
            const [prods] = await connection.execute(
                'SELECT codigo, nombre, precio, iva, cantidad, min FROM producto WHERE codigo = ? AND estado = 1',
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

            // Validar stock disponible
            if (prod.cantidad < item.cantidad) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: `Stock insuficiente para ${prod.nombre}. Disponible: ${prod.cantidad}`
                });
            }

            // Validar que no quede por debajo del mínimo
            const nuevoStock = prod.cantidad - item.cantidad;
            if (nuevoStock < prod.min) {
                // Solo advertencia, no bloquea la venta
                console.warn(`Advertencia: ${prod.nombre} quedará por debajo del stock mínimo`);
            }

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
            'INSERT INTO cab_salida (cedula, fecha, hora, monto) VALUES (?, ?, ?, ?)',
            [cliente_cedula, fecha, hora, montoTotal]
        );

        const facturaId = headerResult.insertId;

        // Insertar detalles y actualizar stock
        for (const detail of productDetails) {
            await connection.execute(
                `INSERT INTO detalle_salida (id, codigo_producto, nombre, precio, iva, cantidad) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [facturaId, detail.codigo_producto, detail.nombre, detail.precio, detail.iva, detail.cantidad]
            );

            // Disminuir stock
            await connection.execute(
                'UPDATE producto SET cantidad = cantidad - ? WHERE codigo = ?',
                [detail.cantidad, detail.codigo_producto]
            );
        }

        // Obtener datos del cliente ANTES del commit (para respuesta y email)
        const [clientQuery] = await connection.execute('SELECT * FROM cliente WHERE cedula = ?', [cliente_cedula]);
        const clientData = clientQuery[0];

        await connection.commit();

        // Registrar en bitácora
        if (req.user) {
            await logAction(req.user.cedula, req.user.nombre, 'Registro una Salida');
        }

        // ----------------------------------------------------
        // ENVIO DE CORREO ASINCRONO (Fuera de la transacción)
        // ----------------------------------------------------
        (async () => {
            try {
                // Datos obtenidos del scope superior

                if (clientData) {
                    const saleData = {
                        id: facturaId,
                        fecha: fecha,
                        hora: hora,
                        monto: montoTotal,
                        entidad: clientData,
                        detalles: productDetails
                    };

                    const emailDestino = clientData.email;
                    if (emailDestino && emailDestino.includes('@')) {
                        console.log(`Generando PDF y enviando factura de venta ${facturaId} a ${emailDestino}...`);
                        const pdfBuffer = await createInvoicePDF(saleData, 'Venta');

                        await sendInvoice(
                            emailDestino,
                            `Su Factura de Compra #${facturaId} - Digital Stock`,
                            `<h1>Gracias por su compra</h1><p>Adjunto encontrará su factura N° ${facturaId}.</p><p>Atentamente,<br>Digital Stock</p>`,
                            pdfBuffer,
                            `Factura_Venta_${facturaId}.pdf`
                        );
                    } else {
                        console.warn(`Cliente ${cliente_cedula} no tiene email válido en campo dirección.`);
                    }
                }
            } catch (emailErr) {
                console.error('Error background enviando email venta:', emailErr);
            }
        })();

        res.status(201).json({
            success: true,
            message: 'Venta registrada exitosamente',
            data: {
                id: facturaId,
                monto: montoTotal,
                subtotal: accumSubtotal,
                iva: accumIva,
                fecha: fecha,
                hora: hora,
                cliente: clientData,
                detalles: productDetails
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error al registrar venta:', error);
        res.status(500).json({
            success: false,
            message: 'Error al registrar venta'
        });
    } finally {
        connection.release();
    }
}

/**
 * Contar ventas
 * GET /api/sales/count
 */
async function count(req, res) {
    try {
        const result = await query('SELECT COUNT(*) as total FROM cab_salida');

        res.json({
            success: true,
            count: result[0].total
        });

    } catch (error) {
        console.error('Error al contar ventas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al contar ventas'
        });
    }
}

module.exports = {
    getAll,
    getById,
    create,
    count
};
