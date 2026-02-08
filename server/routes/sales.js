/**
 * Rutas de Ventas (Salidas)
 * Digital Stock Web
 */

const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');
const { verifyToken } = require('../middleware/auth');
const { validateSale } = require('../middleware/validation');

// Todas las rutas requieren autenticación
router.use(verifyToken);

// GET /api/sales - Obtener todas las ventas
router.get('/', saleController.getAll);

// GET /api/sales/count - Contar ventas
router.get('/count', saleController.count);

// GET /api/sales/:id - Obtener venta con detalles
router.get('/:id', saleController.getById);

// POST /api/sales - Registrar nueva venta
router.post('/', validateSale, saleController.create);

module.exports = router;
