/**
 * Rutas de Compras (Entradas)
 * Digital Stock Web
 */

const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');
const { verifyToken } = require('../middleware/auth');
const { validatePurchase } = require('../middleware/validation');

// Todas las rutas requieren autenticación
router.use(verifyToken);

// GET /api/purchases - Obtener todas las compras
router.get('/', purchaseController.getAll);

// GET /api/purchases/count - Contar compras
router.get('/count', purchaseController.count);

// GET /api/purchases/:id - Obtener compra con detalles
router.get('/:id', purchaseController.getById);

// POST /api/purchases - Registrar nueva compra
router.post('/', validatePurchase, purchaseController.create);

module.exports = router;
