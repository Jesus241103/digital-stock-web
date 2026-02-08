/**
 * Controlador de Autenticación
 * Digital Stock Web
 * 
 * Maneja login, registro y verificación de sesión
 */

const { query } = require('../config/database');
const { generateToken } = require('../middleware/auth');
const { logAction } = require('./logController');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

/**
 * Login de usuario
 * POST /api/auth/login
 */
async function login(req, res) {
    try {
        const { cedula, clave } = req.body;

        // Buscar usuario por cédula
        const users = await query(
            'SELECT cedula, nombre, tlfn, clave, rol FROM usuario WHERE cedula = ?',
            [cedula]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        const user = users[0];

        // Verificar contraseña con bcrypt
        const validPassword = await bcrypt.compare(clave, user.clave);

        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        // Generar token JWT
        const token = generateToken(user);

        // Registrar en bitácora
        await logAction(user.cedula, user.nombre, 'Inicio de sesión');

        res.json({
            success: true,
            message: 'Inicio de sesión exitoso',
            token,
            user: {
                cedula: user.cedula,
                nombre: user.nombre,
                rol: user.rol
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error al iniciar sesión'
        });
    }
}

/**
 * Registro de nuevo usuario
 * POST /api/auth/register
 */
async function register(req, res) {
    try {
        const { cedula, nombre, tlfn, clave } = req.body;

        // Verificar si el usuario ya existe
        const existing = await query(
            'SELECT cedula FROM usuario WHERE cedula = ?',
            [cedula]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un usuario con esa cédula'
            });
        }

        // Hash de la contraseña con bcrypt
        const hashedPassword = await bcrypt.hash(clave, SALT_ROUNDS);

        // Insertar nuevo usuario (rol 'user' por defecto)
        await query(
            'INSERT INTO usuario (cedula, nombre, tlfn, clave, rol) VALUES (?, ?, ?, ?, ?)',
            [cedula, nombre.toUpperCase(), tlfn, hashedPassword, 'user']
        );

        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente'
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({
            success: false,
            message: 'Error al registrar usuario'
        });
    }
}

/**
 * Obtener usuario actual
 * GET /api/auth/me
 */
async function getCurrentUser(req, res) {
    try {
        const users = await query(
            'SELECT cedula, nombre, tlfn, rol FROM usuario WHERE cedula = ?',
            [req.user.cedula]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            user: users[0]
        });

    } catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener usuario'
        });
    }
}

module.exports = {
    login,
    register,
    getCurrentUser
};
