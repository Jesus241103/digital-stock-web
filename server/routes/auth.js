/**
 * Rutas de Autenticación
 * Digital Stock Web
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { validateLogin, validateRegister } = require('../middleware/validation');

// POST /api/auth/login - Iniciar sesión
router.post('/login', validateLogin, authController.login);

// POST /api/auth/register - Registrar usuario
router.post('/register', validateRegister, authController.register);

// GET /api/auth/me - Obtener usuario actual (requiere autenticación)
router.get('/me', verifyToken, authController.getCurrentUser);

module.exports = router;
