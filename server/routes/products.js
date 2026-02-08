/**
 * Rutas de Productos
 * Digital Stock Web
 */

const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { validateProduct, validateProductCode } = require('../middleware/validation');

// Todas las rutas requieren autenticación
router.use(verifyToken);

// GET /api/products - Obtener todos los productos
router.get('/', productController.getAll);

// GET /api/products/count - Contar productos
router.get('/count', productController.count);

// GET /api/products/inventory-value - Valor del inventario
router.get('/inventory-value', productController.getInventoryValue);

// GET /api/products/search - Buscar productos (autocomplete)
router.get('/search', productController.search);

// GET /api/products/low-stock - Productos con stock bajo
router.get('/low-stock', productController.getLowStock);

// GET /api/products/:codigo - Obtener producto por código
router.get('/:codigo', validateProductCode, productController.getByCode);

// POST /api/products - Crear producto (solo admin)
router.post('/', isAdmin, validateProduct, productController.create);

// PUT /api/products/:codigo - Actualizar producto (solo admin)
router.put('/:codigo', isAdmin, validateProductCode, productController.update);

// DELETE /api/products/:codigo - Eliminar producto (solo admin)
router.delete('/:codigo', isAdmin, validateProductCode, productController.remove);

module.exports = router;
