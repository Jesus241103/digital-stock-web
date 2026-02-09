/**
 * Controlador de Bitácora
 * Digital Stock Web
 * 
 * Registro y consulta de actividades del sistema
 */

const { query } = require('../config/database');

/**
 * Obtener registros de la bitácora
 * GET /api/logs
 */
async function getAll(req, res) {
    try {
        const { search, accion, limit } = req.query;

        let sql = 'SELECT * FROM bitacora';
        const params = [];
        const conditions = [];

        if (accion) {
            conditions.push('accion = ?');
            params.push(accion);
        }

        if (search) {
            conditions.push('(cedula LIKE ? OR nombre LIKE ? OR accion LIKE ?)');
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY id DESC';

        if (limit && !isNaN(parseInt(limit))) {
            sql += ' LIMIT ?';
            params.push(parseInt(limit));
        }

        const logs = await query(sql, params);

        res.json({
            success: true,
            data: logs,
            count: logs.length
        });

    } catch (error) {
        console.error('Error al obtener bitácora:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener bitácora'
        });
    }
}

/**
 * Agregar registro a la bitácora
 * POST /api/logs
 */
async function create(req, res) {
    try {
        const { accion } = req.body;
        const { cedula, nombre } = req.user;

        // Obtener fecha y hora actual
        const now = new Date();
        const fecha = now.toISOString().split('T')[0];
        const hora = now.toTimeString().split(' ')[0];

        await query(
            'INSERT INTO bitacora (cedula, nombre, fecha, hora, accion) VALUES (?, ?, ?, ?, ?)',
            [cedula, nombre, fecha, hora, accion]
        );

        res.status(201).json({
            success: true,
            message: 'Registro agregado a bitácora'
        });

    } catch (error) {
        console.error('Error al agregar a bitácora:', error);
        res.status(500).json({
            success: false,
            message: 'Error al agregar registro'
        });
    }
}

/**
 * Registrar acción en bitácora (función interna)
 * @param {number} cedula - Cédula del usuario
 * @param {string} nombre - Nombre del usuario
 * @param {string} accion - Descripción de la acción
 */
async function logAction(cedula, nombre, accion) {
    try {
        const now = new Date();
        const fecha = now.toISOString().split('T')[0];
        const hora = now.toTimeString().split(' ')[0];

        await query(
            'INSERT INTO bitacora (cedula, nombre, fecha, hora, accion) VALUES (?, ?, ?, ?, ?)',
            [cedula, nombre, fecha, hora, accion]
        );
    } catch (error) {
        console.error('Error al registrar en bitácora:', error);
    }
}

/**
 * Obtener lista de acciones únicas para filtros
 * GET /api/logs/actions
 */
async function getActions(req, res) {
    try {
        const actions = await query('SELECT DISTINCT accion FROM bitacora ORDER BY accion ASC');
        res.json({
            success: true,
            data: actions.map(a => a.accion)
        });
    } catch (error) {
        console.error('Error al obtener acciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener acciones'
        });
    }
}

module.exports = {
    getAll,
    create,
    logAction,
    getActions
};
