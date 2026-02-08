/**
 * Rutas de Proveedores
 * Digital Stock Web
 */

const express = require('express');
const router = express.Router();
const providerController = require('../controllers/providerController');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { validateProvider, validateProviderCode } = require('../middleware/validation');

// Todas las rutas requieren autenticación
router.use(verifyToken);

// GET /api/providers - Obtener todos los proveedores
router.get('/', providerController.getAll);

// GET /api/providers/count - Contar proveedores
router.get('/count', providerController.count);

// GET /api/providers/search - Buscar proveedores (autocomplete)
router.get('/search', providerController.search);

// GET /api/providers/:codigo - Obtener proveedor por código
router.get('/:codigo', validateProviderCode, providerController.getByCode);

// POST /api/providers - Crear proveedor (solo admin)
router.post('/', isAdmin, validateProvider, providerController.create);

// PUT /api/providers/:codigo - Actualizar proveedor (solo admin)
router.put('/:codigo', isAdmin, validateProviderCode, providerController.update);

// DELETE /api/providers/:codigo - Eliminar proveedor (solo admin)
router.delete('/:codigo', isAdmin, validateProviderCode, providerController.remove);

module.exports = router;
