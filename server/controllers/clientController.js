/**
 * Controlador de Clientes
 * Digital Stock Web
 * 
 * CRUD completo de clientes
 */

const { query } = require('../config/database');
const { logAction } = require('./logController');

/**
 * Obtener todos los clientes
 * GET /api/clients
 */
async function getAll(req, res) {
    try {
        const { search } = req.query;

        let sql = 'SELECT * FROM cliente';
        const params = [];

        if (search) {
            sql += ' WHERE nombre LIKE ? OR cedula LIKE ?';
            params.push(`%${search}%`, `%${search}%`);
        }

        sql += ' ORDER BY nombre ASC';

        const clients = await query(sql, params);

        res.json({
            success: true,
            data: clients,
            count: clients.length
        });

    } catch (error) {
        console.error('Error al obtener clientes:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener clientes'
        });
    }
}

/**
 * Obtener un cliente por cédula
 * GET /api/clients/:cedula
 */
async function getByCedula(req, res) {
    try {
        const { cedula } = req.params;

        const clients = await query(
            'SELECT * FROM cliente WHERE cedula = ?',
            [cedula]
        );

        if (clients.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cliente no encontrado'
            });
        }

        res.json({
            success: true,
            data: clients[0]
        });

    } catch (error) {
        console.error('Error al obtener cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener cliente'
        });
    }
}

/**
 * Buscar clientes para autocomplete
 * GET /api/clients/search
 */
async function search(req, res) {
    try {
        const { q } = req.query;

        let sql = 'SELECT cedula, nombre, telefono, email FROM cliente';
        const params = [];

        if (q && q.trim().length > 0) {
            sql += ' WHERE nombre LIKE ? OR cedula LIKE ?';
            params.push(`%${q}%`, `%${q}%`);
        }

        sql += ' ORDER BY nombre ASC LIMIT 10';

        const clients = await query(sql, params);

        res.json({
            success: true,
            data: clients
        });

    } catch (error) {
        console.error('Error en búsqueda de clientes:', error);
        res.status(500).json({
            success: false,
            message: 'Error en búsqueda'
        });
    }
}

/**
 * Crear nuevo cliente
 * POST /api/clients
 */
async function create(req, res) {
    try {
        const { cedula, nombre, telefono, email } = req.body;

        // Verificar si ya existe
        const existing = await query(
            'SELECT cedula FROM cliente WHERE cedula = ?',
            [cedula]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un cliente con esa cédula'
            });
        }

        await query(
            'INSERT INTO cliente (cedula, nombre, telefono, email) VALUES (?, ?, ?, ?)',
            [cedula, nombre, telefono, email]
        );

        // Bitácora
        if (req.user) {
            await logAction(req.user.cedula, req.user.nombre, 'Agrego un Nuevo Cliente.');
        }

        res.status(201).json({
            success: true,
            message: 'Cliente creado exitosamente'
        });

    } catch (error) {
        console.error('Error al crear cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear cliente'
        });
    }
}

/**
 * Actualizar cliente
 * PUT /api/clients/:cedula
 */
async function update(req, res) {
    try {
        const { cedula } = req.params;
        const { nombre, telefono, email } = req.body;

        const result = await query(
            'UPDATE cliente SET nombre = ?, telefono = ?, email = ? WHERE cedula = ?',
            [nombre, telefono, email, cedula]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cliente no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Cliente actualizado exitosamente'
        });

    } catch (error) {
        console.error('Error al actualizar cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar cliente'
        });
    }
}

/**
 * Eliminar cliente
 * DELETE /api/clients/:cedula
 */
async function remove(req, res) {
    try {
        const { cedula } = req.params;

        const result = await query(
            'DELETE FROM cliente WHERE cedula = ?',
            [cedula]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cliente no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Cliente eliminado exitosamente'
        });

    } catch (error) {
        console.error('Error al eliminar cliente:', error);
        // Si hay facturas asociadas, no se puede eliminar
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({
                success: false,
                message: 'No se puede eliminar, el cliente tiene ventas asociadas'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error al eliminar cliente'
        });
    }
}

/**
 * Contar clientes
 * GET /api/clients/count
 */
async function count(req, res) {
    try {
        const result = await query('SELECT COUNT(*) as total FROM cliente');

        res.json({
            success: true,
            count: result[0].total
        });

    } catch (error) {
        console.error('Error al contar clientes:', error);
        res.status(500).json({
            success: false,
            message: 'Error al contar clientes'
        });
    }
}

module.exports = {
    getAll,
    getByCedula,
    search,
    create,
    update,
    remove,
    count
};
