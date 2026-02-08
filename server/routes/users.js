/**
 * Rutas de Usuarios
 * Digital Stock Web
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Todas las rutas requieren autenticación y ser admin
router.use(verifyToken);
router.use(isAdmin);

// GET /api/users - Obtener todos los usuarios
router.get('/', userController.getAll);

// GET /api/users/count - Contar usuarios
router.get('/count', userController.count);

// GET /api/users/:cedula - Obtener usuario por cédula
router.get('/:cedula', userController.getByCedula);

// PUT /api/users/:cedula - Actualizar usuario
router.put('/:cedula', userController.update);

// DELETE /api/users/:cedula - Eliminar usuario
router.delete('/:cedula', userController.remove);

module.exports = router;
