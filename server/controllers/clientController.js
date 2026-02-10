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
        const { search, status } = req.query;

        let sql = 'SELECT * FROM cliente';
        const params = [];
        const conditions = [];

        if (search) {
            conditions.push('(nombre LIKE ? OR cedula LIKE ?)');
            params.push(`%${search}%`, `%${search}%`);
        }

        // Por defecto mostrar activos, a menos que se pida 'all' o 'inactive'
        if (status === 'inactive') {
            conditions.push('estado = 0');
        } else if (status === 'all') {
            // No filtrar por estado
        } else {
            conditions.push('estado = 1'); // Default: solo activos
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
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
 * Buscar clientes para autocomplete (SOLO ACTIVOS)
 * GET /api/clients/search
 */
async function search(req, res) {
    try {
        const { q } = req.query;

        let sql = 'SELECT cedula, nombre, telefono, email FROM cliente WHERE estado = 1';
        const params = [];

        if (q && q.trim().length > 0) {
            sql += ' AND (nombre LIKE ? OR cedula LIKE ?)';
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
            'SELECT cedula, estado FROM cliente WHERE cedula = ?',
            [cedula]
        );

        if (existing.length > 0) {
            const client = existing[0];
            if (client.estado === 0) {
                // Reactivar cliente si existe pero está inactivo
                await query(
                    'UPDATE cliente SET nombre = ?, telefono = ?, email = ?, estado = 1 WHERE cedula = ?',
                    [nombre, telefono, email, cedula]
                );

                await logAction(req.user.cedula, req.user.nombre, 'Reactivo Cliente');

                return res.status(200).json({
                    success: true,
                    message: 'Cliente reactivado exitosamente'
                });
            }

            return res.status(400).json({
                success: false,
                message: 'Ya existe un cliente con esa cédula'
            });
        }

        await query(
            'INSERT INTO cliente (cedula, nombre, telefono, email, estado) VALUES (?, ?, ?, ?, 1)',
            [cedula, nombre, telefono, email]
        );

        // Bitácora
        await logAction(req.user.cedula, req.user.nombre, 'Agrego un Nuevo Cliente');


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
        const { nombre, telefono, email, estado } = req.body; // Acepta estado también

        // Construir query dinámico para permitir actualizar solo estado
        let sql = 'UPDATE cliente SET ';
        const params = [];
        const updates = [];

        if (nombre !== undefined) { updates.push('nombre = ?'); params.push(nombre); }
        if (telefono !== undefined) { updates.push('telefono = ?'); params.push(telefono); }
        if (email !== undefined) { updates.push('email = ?'); params.push(email); }
        if (estado !== undefined) { updates.push('estado = ?'); params.push(estado); }

        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: 'No hay datos para actualizar' });
        }

        sql += updates.join(', ') + ' WHERE cedula = ?';
        params.push(cedula);

        const result = await query(sql, params);

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
 * Eliminar cliente (Lógico)
 * DELETE /api/clients/:cedula
 */
async function remove(req, res) {
    try {
        const { cedula } = req.params;

        // Eliminación lógica: update estado = 0
        const result = await query(
            'UPDATE cliente SET estado = 0 WHERE cedula = ?',
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
            message: 'Cliente desactivado exitosamente (eliminación lógica)'
        });

    } catch (error) {
        console.error('Error al eliminar cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar cliente'
        });
    }
}

/**
 * Contar clientes (Activos)
 * GET /api/clients/count
 */
async function count(req, res) {
    try {
        const result = await query('SELECT COUNT(*) as total FROM cliente WHERE estado = 1');

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
