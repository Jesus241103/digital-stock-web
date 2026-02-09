/**
 * Controlador de Productos
 * Digital Stock Web
 * 
 * CRUD completo de productos del inventario
 */

const { query } = require('../config/database');
const { logAction } = require('./logController');

/**
 * Obtener todos los productos
 * GET /api/products
 */
async function getAll(req, res) {
    try {
        const { search, estado } = req.query;

        let sql = 'SELECT * FROM producto';
        const params = [];
        const conditions = [];

        // Filtro por estado
        if (estado !== undefined) {
            conditions.push('estado = ?');
            params.push(estado);
        }

        // Búsqueda por nombre o código
        if (search) {
            conditions.push('(nombre LIKE ? OR codigo LIKE ?)');
            params.push(`%${search}%`, `%${search}%`);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY codigo ASC';

        const products = await query(sql, params);

        res.json({
            success: true,
            data: products,
            count: products.length
        });

    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener productos'
        });
    }
}

/**
 * Obtener un producto por código
 * GET /api/products/:codigo
 */
async function getByCode(req, res) {
    try {
        const { codigo } = req.params;

        const products = await query(
            'SELECT * FROM producto WHERE codigo = ?',
            [codigo]
        );

        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        res.json({
            success: true,
            data: products[0]
        });

    } catch (error) {
        console.error('Error al obtener producto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener producto'
        });
    }
}

/**
 * Crear nuevo producto
 * POST /api/products
 */
async function create(req, res) {
    try {
        const { codigo, nombre, precio, iva, min, max, cantidad = 0 } = req.body;

        // Verificar que min < max
        if (parseInt(min) >= parseInt(max)) {
            return res.status(400).json({
                success: false,
                message: 'Stock mínimo debe ser menor que stock máximo'
            });
        }

        // Verificar si ya existe
        const existing = await query(
            'SELECT codigo FROM producto WHERE codigo = ?',
            [codigo]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un producto con ese código'
            });
        }

        // Insertar producto
        await query(
            `INSERT INTO producto (codigo, nombre, precio, iva, min, max, cantidad, estado) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
            [codigo, nombre, precio, iva, min, max, cantidad]
        );

        // Bitácora
        if (req.user) {
            await logAction(req.user.cedula, req.user.nombre, 'Agrego un Nuevo Producto');
        }

        res.status(201).json({
            success: true,
            message: 'Producto creado exitosamente'
        });

    } catch (error) {
        console.error('Error al crear producto:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un producto con ese nombre'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error al crear producto'
        });
    }
}

/**
 * Actualizar producto
 * PUT /api/products/:codigo
 */
async function update(req, res) {
    try {
        const { codigo } = req.params;
        const { nombre, precio, iva, min, max, cantidad, estado } = req.body;

        // Verificar que el producto existe
        const existing = await query(
            'SELECT codigo FROM producto WHERE codigo = ?',
            [codigo]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        // Verificar que min < max si se proporcionan
        if (min !== undefined && max !== undefined && parseInt(min) >= parseInt(max)) {
            return res.status(400).json({
                success: false,
                message: 'Stock mínimo debe ser menor que stock máximo'
            });
        }

        // Construir consulta de actualización dinámica
        const updates = [];
        const params = [];

        if (nombre !== undefined) {
            updates.push('nombre = ?');
            params.push(nombre);
        }
        if (precio !== undefined) {
            updates.push('precio = ?');
            params.push(precio);
        }
        if (iva !== undefined) {
            updates.push('iva = ?');
            params.push(iva);
        }
        if (min !== undefined) {
            updates.push('min = ?');
            params.push(min);
        }
        if (max !== undefined) {
            updates.push('max = ?');
            params.push(max);
        }
        if (cantidad !== undefined) {
            updates.push('cantidad = ?');
            params.push(cantidad);
        }
        if (estado !== undefined) {
            updates.push('estado = ?');
            params.push(estado);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No se proporcionaron campos para actualizar'
            });
        }

        params.push(codigo);
        await query(
            `UPDATE producto SET ${updates.join(', ')} WHERE codigo = ?`,
            params
        );

        res.json({
            success: true,
            message: 'Producto actualizado exitosamente'
        });

    } catch (error) {
        console.error('Error al actualizar producto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar producto'
        });
    }
}

/**
 * Eliminar producto (cambiar estado a inactivo)
 * DELETE /api/products/:codigo
 */
async function remove(req, res) {
    try {
        const { codigo } = req.params;

        const result = await query(
            'UPDATE producto SET estado = 0 WHERE codigo = ?',
            [codigo]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Producto eliminado exitosamente'
        });

    } catch (error) {
        console.error('Error al eliminar producto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar producto'
        });
    }
}

/**
 * Contar productos
 * GET /api/products/count
 */
async function count(req, res) {
    try {
        const result = await query('SELECT COUNT(*) as total FROM producto WHERE estado = 1');

        res.json({
            success: true,
            count: result[0].total
        });

    } catch (error) {
        console.error('Error al contar productos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al contar productos'
        });
    }
}

/**
 * Obtener valor total del inventario
 * GET /api/products/inventory-value
 */
async function getInventoryValue(req, res) {
    try {
        const result = await query(
            'SELECT SUM(precio * cantidad) as valor FROM producto WHERE estado = 1'
        );

        res.json({
            success: true,
            value: result[0].valor || 0
        });

    } catch (error) {
        console.error('Error al obtener valor de inventario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener valor de inventario'
        });
    }
}

/**
 * Obtener productos con stock bajo
 * GET /api/products/low-stock
 */
async function getLowStock(req, res) {
    try {
        const products = await query(
            'SELECT * FROM producto WHERE estado = 1 AND cantidad <= min ORDER BY cantidad ASC'
        );

        res.json({
            success: true,
            data: products,
            count: products.length
        });

    } catch (error) {
        console.error('Error al obtener productos con stock bajo:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener productos con stock bajo'
        });
    }
}

/**
 * Buscar productos para autocomplete
 * GET /api/products/search
 */
async function search(req, res) {
    try {
        const { q } = req.query;

        let sql = 'SELECT * FROM producto WHERE estado = 1';
        const params = [];

        if (q && q.trim().length > 0) {
            sql += ' AND (nombre LIKE ? OR codigo LIKE ?)';
            params.push(`%${q}%`, `%${q}%`);
        }

        // Priorizar aquellos con stock > 0, luego alfabético
        sql += ' ORDER BY cantidad DESC, nombre ASC LIMIT 10';

        const products = await query(sql, params);

        res.json({
            success: true,
            data: products
        });

    } catch (error) {
        console.error('Error en búsqueda de productos:', error);
        res.status(500).json({
            success: false,
            message: 'Error en búsqueda'
        });
    }
}

module.exports = {
    getAll,
    getByCode,
    search,
    create,
    update,
    remove,
    count,
    getInventoryValue,
    getLowStock
};
