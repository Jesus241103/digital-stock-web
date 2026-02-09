/**
 * Rutas de Reportes
 * Digital Stock Web
 */

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(verifyToken);

// GET /api/reports/dashboard - Estadísticas del dashboard
router.get('/dashboard', reportController.getDashboardStats);

// GET /api/reports/charts - Datos para gráficos
router.get('/charts', reportController.getChartData);

// GET /api/reports/monthly/:month - Reporte mensual
router.get('/monthly/:month', reportController.getMonthlyReport);

// GET /api/reports/biweekly/:month - Reporte quincenal
router.get('/biweekly/:month', reportController.getBiweeklyReport);

// GET /api/reports/dollar-rate - Obtener tasa del dólar (BCV)
router.get('/dollar-rate', reportController.getDollarRate);

module.exports = router;
