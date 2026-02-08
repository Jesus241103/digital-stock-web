/**
 * Rutas de Clientes
 * Digital Stock Web
 */

const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { verifyToken } = require('../middleware/auth');
const { validateClient, validateClientCedula } = require('../middleware/validation');

// Todas las rutas requieren autenticación
router.use(verifyToken);

// GET /api/clients - Obtener todos los clientes
router.get('/', clientController.getAll);

// GET /api/clients/count - Contar clientes
router.get('/count', clientController.count);

// GET /api/clients/search - Buscar clientes (autocomplete)
router.get('/search', clientController.search);

// GET /api/clients/:cedula - Obtener cliente por cédula
router.get('/:cedula', validateClientCedula, clientController.getByCedula);

// POST /api/clients - Crear cliente
router.post('/', validateClient, clientController.create);

// PUT /api/clients/:cedula - Actualizar cliente
router.put('/:cedula', validateClientCedula, clientController.update);

// DELETE /api/clients/:cedula - Eliminar cliente
router.delete('/:cedula', validateClientCedula, clientController.remove);

module.exports = router;
