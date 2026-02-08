/**
 * Rutas de Bitácora
 * Digital Stock Web
 */

const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const { verifyToken } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(verifyToken);

// GET /api/logs/actions - Obtener lista de acciones
router.get('/actions', logController.getActions);

// GET /api/logs - Obtener registros de bitácora
router.get('/', logController.getAll);

// POST /api/logs - Agregar registro a bitácora
router.post('/', logController.create);

module.exports = router;
