/**
 * Middleware de Autenticación JWT
 * Digital Stock Web
 * 
 * Verifica tokens JWT y protege rutas privadas
 */

const jwt = require('jsonwebtoken');

/**
 * Verifica que el usuario esté autenticado
 * Extrae y valida el token JWT del header Authorization
 */
function verifyToken(req, res, next) {
    try {
        // Obtener el header de autorización
        const authHeader = req.headers['authorization'];

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'Acceso denegado. No se proporcionó token'
            });
        }

        // El token viene como "Bearer <token>"
        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Formato de token inválido'
            });
        }

        // Verificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Agregar datos del usuario al request
        req.user = decoded;

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expirado. Inicie sesión nuevamente'
            });
        }

        return res.status(401).json({
            success: false,
            message: 'Token inválido'
        });
    }
}

/**
 * Verifica que el usuario sea administrador
 * Debe usarse después de verifyToken
 */
function isAdmin(req, res, next) {
    if (req.user && req.user.rol === 'admin') {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado. Se requieren privilegios de administrador'
        });
    }
}

/**
 * Genera un token JWT para un usuario
 * @param {Object} user - Datos del usuario
 * @returns {string} Token JWT
 */
function generateToken(user) {
    return jwt.sign(
        {
            cedula: user.cedula,
            nombre: user.nombre,
            rol: user.rol
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
}

module.exports = {
    verifyToken,
    isAdmin,
    generateToken
};
