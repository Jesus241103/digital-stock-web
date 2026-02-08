/**
 * Controlador de Proveedores
 * Digital Stock Web
 * 
 * CRUD completo de proveedores
 */

const { query } = require('../config/database');
const { logAction } = require('./logController');

/**
 * Obtener todos los proveedores
 * GET /api/providers
 */
async function getAll(req, res) {
    try {
        const { search, estado } = req.query;

        let sql = 'SELECT * FROM proveedor';
        const params = [];
        const conditions = [];

        if (estado !== undefined) {
            conditions.push('estado = ?');
            params.push(estado);
        }

        if (search) {
            conditions.push('(nombre LIKE ? OR codigo LIKE ?)');
            params.push(`%${search}%`, `%${search}%`);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY nombre ASC';

        const providers = await query(sql, params);

        res.json({
            success: true,
            data: providers,
            count: providers.length
        });

    } catch (error) {
        console.error('Error al obtener proveedores:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener proveedores'
        });
    }
}

/**
 * Obtener un proveedor por código
 * GET /api/providers/:codigo
 */
async function getByCode(req, res) {
    try {
        const { codigo } = req.params;

        const providers = await query(
            'SELECT * FROM proveedor WHERE codigo = ?',
            [codigo]
        );

        if (providers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Proveedor no encontrado'
            });
        }

        res.json({
            success: true,
            data: providers[0]
        });

    } catch (error) {
        console.error('Error al obtener proveedor:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener proveedor'
        });
    }
}

/**
 * Buscar proveedores para autocomplete
 * GET /api/providers/search
 */
async function search(req, res) {
    try {
        const { q } = req.query;

        let sql = 'SELECT codigo, nombre, telefono, email FROM proveedor WHERE estado = 1';
        const params = [];

        if (q && q.trim().length > 0) {
            sql += ' AND (nombre LIKE ? OR codigo LIKE ?)';
            params.push(`%${q}%`, `%${q}%`);
        }

        sql += ' ORDER BY nombre ASC LIMIT 10';

        const providers = await query(sql, params);

        res.json({
            success: true,
            data: providers
        });

    } catch (error) {
        console.error('Error en búsqueda de proveedores:', error);
        res.status(500).json({
            success: false,
            message: 'Error en búsqueda'
        });
    }
}

/**
 * Crear nuevo proveedor
 * POST /api/providers
 */
async function create(req, res) {
    try {
        const { codigo, nombre, telefono, email } = req.body;

        // Verificar si ya existe
        const existing = await query(
            'SELECT codigo FROM proveedor WHERE codigo = ?',
            [codigo]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un proveedor con ese código'
            });
        }

        await query(
            'INSERT INTO proveedor (codigo, nombre, telefono, email, estado) VALUES (?, ?, ?, ?, 1)',
            [codigo, nombre, telefono, email]
        );

        // Bitácora
        if (req.user) {
            await logAction(req.user.cedula, req.user.nombre, 'Agrego un Nuevo Proveedor.');
        }

        res.status(201).json({
            success: true,
            message: 'Proveedor creado exitosamente'
        });

    } catch (error) {
        console.error('Error al crear proveedor:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear proveedor'
        });
    }
}

/**
 * Actualizar proveedor
 * PUT /api/providers/:codigo
 */
async function update(req, res) {
    try {
        const { codigo } = req.params;
        const { nombre, telefono, email, estado } = req.body;

        // Construir consulta dinámica
        const updates = [];
        const params = [];

        if (nombre !== undefined) {
            updates.push('nombre = ?');
            params.push(nombre);
        }
        if (telefono !== undefined) {
            updates.push('telefono = ?');
            params.push(telefono);
        }
        if (email !== undefined) {
            updates.push('email = ?');
            params.push(email);
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
        const result = await query(
            `UPDATE proveedor SET ${updates.join(', ')} WHERE codigo = ?`,
            params
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Proveedor no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Proveedor actualizado exitosamente'
        });

    } catch (error) {
        console.error('Error al actualizar proveedor:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar proveedor'
        });
    }
}

/**
 * Eliminar proveedor (cambiar estado a inactivo)
 * DELETE /api/providers/:codigo
 */
async function remove(req, res) {
    try {
        const { codigo } = req.params;

        const result = await query(
            'UPDATE proveedor SET estado = 0 WHERE codigo = ?',
            [codigo]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Proveedor no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Proveedor eliminado exitosamente'
        });

    } catch (error) {
        console.error('Error al eliminar proveedor:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar proveedor'
        });
    }
}

/**
 * Contar proveedores activos
 * GET /api/providers/count
 */
async function count(req, res) {
    try {
        const result = await query('SELECT COUNT(*) as total FROM proveedor WHERE estado = 1');

        res.json({
            success: true,
            count: result[0].total
        });

    } catch (error) {
        console.error('Error al contar proveedores:', error);
        res.status(500).json({
            success: false,
            message: 'Error al contar proveedores'
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
    count
};
