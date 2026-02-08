/**
 * Controlador de Usuarios
 * Digital Stock Web
 * 
 * Gestión de usuarios (solo admin)
 */

const { query } = require('../config/database');

/**
 * Obtener todos los usuarios
 * GET /api/users
 */
async function getAll(req, res) {
    try {
        const users = await query(
            'SELECT cedula, nombre, tlfn, rol FROM usuario ORDER BY nombre ASC'
        );

        res.json({
            success: true,
            data: users,
            count: users.length
        });

    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener usuarios'
        });
    }
}

/**
 * Obtener un usuario por cédula
 * GET /api/users/:cedula
 */
async function getByCedula(req, res) {
    try {
        const { cedula } = req.params;

        const users = await query(
            'SELECT cedula, nombre, tlfn, rol FROM usuario WHERE cedula = ?',
            [cedula]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            data: users[0]
        });

    } catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener usuario'
        });
    }
}

/**
 * Actualizar usuario
 * PUT /api/users/:cedula
 */
async function update(req, res) {
    try {
        const { cedula } = req.params;
        const { nombre, tlfn, clave, rol } = req.body;

        // Construir consulta dinámica
        const updates = [];
        const params = [];

        if (nombre !== undefined) {
            updates.push('nombre = ?');
            params.push(nombre);
        }
        if (tlfn !== undefined) {
            updates.push('tlfn = ?');
            params.push(tlfn);
        }
        if (clave !== undefined && clave.length >= 5) {
            updates.push('clave = ?');
            params.push(clave);
        }
        if (rol !== undefined && (rol === 'admin' || rol === 'user')) {
            updates.push('rol = ?');
            params.push(rol);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No se proporcionaron campos válidos para actualizar'
            });
        }

        params.push(cedula);
        const result = await query(
            `UPDATE usuario SET ${updates.join(', ')} WHERE cedula = ?`,
            params
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Usuario actualizado exitosamente'
        });

    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar usuario'
        });
    }
}

/**
 * Eliminar usuario
 * DELETE /api/users/:cedula
 */
async function remove(req, res) {
    try {
        const { cedula } = req.params;

        // No permitir eliminar al propio usuario
        if (parseInt(cedula) === req.user.cedula) {
            return res.status(400).json({
                success: false,
                message: 'No puede eliminar su propio usuario'
            });
        }

        const result = await query(
            'DELETE FROM usuario WHERE cedula = ?',
            [cedula]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Usuario eliminado exitosamente'
        });

    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        // Si hay registros asociados en bitácora
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({
                success: false,
                message: 'No se puede eliminar, el usuario tiene registros asociados'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error al eliminar usuario'
        });
    }
}

/**
 * Contar usuarios
 * GET /api/users/count
 */
async function count(req, res) {
    try {
        const result = await query('SELECT COUNT(*) as total FROM usuario');

        res.json({
            success: true,
            count: result[0].total
        });

    } catch (error) {
        console.error('Error al contar usuarios:', error);
        res.status(500).json({
            success: false,
            message: 'Error al contar usuarios'
        });
    }
}

module.exports = {
    getAll,
    getByCedula,
    update,
    remove,
    count
};
