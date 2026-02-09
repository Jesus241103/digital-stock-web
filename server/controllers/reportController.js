/**
 * Controlador de Reportes
 * Digital Stock Web
 * 
 * Generación de reportes mensuales, quincenales y semanales
 */

const { query } = require('../config/database');

/**
 * Obtener estadísticas del dashboard
 * GET /api/reports/dashboard
 */
async function getDashboardStats(req, res) {
    try {
        // Contar productos activos
        const [productCount] = await query('SELECT COUNT(*) as total FROM producto WHERE estado = 1');

        // Contar clientes
        const [clientCount] = await query('SELECT COUNT(*) as total FROM cliente');

        // Contar proveedores activos
        const [providerCount] = await query('SELECT COUNT(*) as total FROM proveedor WHERE estado = 1');

        // Contar usuarios
        const [userCount] = await query('SELECT COUNT(*) as total FROM usuario');

        // Valor total del inventario
        const [inventoryValue] = await query(
            'SELECT COALESCE(SUM(precio * cantidad), 0) as valor FROM producto WHERE estado = 1'
        );

        // Total entradas del mes
        const [purchasesMonth] = await query(
            `SELECT COALESCE(SUM(monto), 0) as total FROM cab_factura 
             WHERE MONTH(fecha) = MONTH(CURRENT_DATE()) AND YEAR(fecha) = YEAR(CURRENT_DATE())`
        );

        // Total salidas del mes
        const [salesMonth] = await query(
            `SELECT COALESCE(SUM(monto), 0) as total FROM cab_salida 
             WHERE MONTH(fecha) = MONTH(CURRENT_DATE()) AND YEAR(fecha) = YEAR(CURRENT_DATE())`
        );

        // Productos con stock bajo
        const lowStockProducts = await query(
            'SELECT codigo, nombre, cantidad, min FROM producto WHERE estado = 1 AND cantidad <= min LIMIT 5'
        );

        // Últimas 5 compras
        const recentPurchases = await query(
            `SELECT cf.id, p.nombre as proveedor, cf.fecha, cf.monto 
             FROM cab_factura cf
             LEFT JOIN proveedor p ON cf.cedula = p.codigo
             ORDER BY cf.id DESC LIMIT 5`
        );

        // Últimas 5 ventas
        const recentSales = await query(
            `SELECT cs.id, c.nombre as cliente, cs.fecha, cs.monto 
             FROM cab_salida cs
             LEFT JOIN cliente c ON cs.cedula = c.cedula
             ORDER BY cs.id DESC LIMIT 5`
        );

        res.json({
            success: true,
            data: {
                counts: {
                    productos: productCount.total,
                    clientes: clientCount.total,
                    proveedores: providerCount.total,
                    usuarios: userCount.total
                },
                inventoryValue: inventoryValue.valor,
                monthlyPurchases: purchasesMonth.total,
                monthlySales: salesMonth.total,
                lowStockProducts,
                recentPurchases,
                recentSales
            }
        });

    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas'
        });
    }
}

/**
 * Reporte mensual de transacciones
 * GET /api/reports/monthly/:month
 */
async function getMonthlyReport(req, res) {
    try {
        const { month } = req.params;
        const year = req.query.year || new Date().getFullYear();

        // Compras del mes
        const purchases = await query(
            `SELECT cf.id, cf.cedula, p.nombre as proveedor, cf.fecha, cf.hora, cf.monto
             FROM cab_factura cf
             LEFT JOIN proveedor p ON cf.cedula = p.codigo
             WHERE MONTH(cf.fecha) = ? AND YEAR(cf.fecha) = ?
             ORDER BY cf.fecha, cf.hora`,
            [month, year]
        );

        // Ventas del mes
        const sales = await query(
            `SELECT cs.id, cs.cedula, c.nombre as cliente, cs.fecha, cs.hora, cs.monto
             FROM cab_salida cs
             LEFT JOIN cliente c ON cs.cedula = c.cedula
             WHERE MONTH(cs.fecha) = ? AND YEAR(cs.fecha) = ?
             ORDER BY cs.fecha, cs.hora`,
            [month, year]
        );

        // Totales
        const totalPurchases = purchases.reduce((sum, p) => sum + p.monto, 0);
        const totalSales = sales.reduce((sum, s) => sum + s.monto, 0);

        res.json({
            success: true,
            data: {
                month,
                year,
                purchases,
                sales,
                totals: {
                    purchases: totalPurchases,
                    sales: totalSales,
                    balance: totalSales - totalPurchases
                }
            }
        });

    } catch (error) {
        console.error('Error en reporte mensual:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar reporte mensual'
        });
    }
}

/**
 * Reporte quincenal
 * GET /api/reports/biweekly/:month
 */
async function getBiweeklyReport(req, res) {
    try {
        const { month } = req.params;
        const year = req.query.year || new Date().getFullYear();

        // Primera quincena (días 1-15)
        const q1Purchases = await query(
            `SELECT cf.id, cf.cedula, p.nombre as proveedor, cf.fecha, cf.monto 
             FROM cab_factura cf
             LEFT JOIN proveedor p ON cf.cedula = p.codigo
             WHERE MONTH(cf.fecha) = ? AND YEAR(cf.fecha) = ? AND DAY(cf.fecha) <= 15
             ORDER BY cf.fecha`,
            [month, year]
        );

        const q1Sales = await query(
            `SELECT cs.id, cs.cedula, c.nombre as cliente, cs.fecha, cs.monto 
             FROM cab_salida cs
             LEFT JOIN cliente c ON cs.cedula = c.cedula
             WHERE MONTH(cs.fecha) = ? AND YEAR(cs.fecha) = ? AND DAY(cs.fecha) <= 15
             ORDER BY cs.fecha`,
            [month, year]
        );

        // Segunda quincena (días 16-31)
        const q2Purchases = await query(
            `SELECT cf.id, cf.cedula, p.nombre as proveedor, cf.fecha, cf.monto 
             FROM cab_factura cf
             LEFT JOIN proveedor p ON cf.cedula = p.codigo
             WHERE MONTH(cf.fecha) = ? AND YEAR(cf.fecha) = ? AND DAY(cf.fecha) > 15
             ORDER BY cf.fecha`,
            [month, year]
        );

        const q2Sales = await query(
            `SELECT cs.id, cs.cedula, c.nombre as cliente, cs.fecha, cs.monto 
             FROM cab_salida cs
             LEFT JOIN cliente c ON cs.cedula = c.cedula
             WHERE MONTH(cs.fecha) = ? AND YEAR(cs.fecha) = ? AND DAY(cs.fecha) > 15
             ORDER BY cs.fecha`,
            [month, year]
        );

        res.json({
            success: true,
            data: {
                month,
                year,
                firstHalf: {
                    purchases: q1Purchases,
                    sales: q1Sales,
                    totalPurchases: q1Purchases.reduce((sum, p) => sum + p.monto, 0),
                    totalSales: q1Sales.reduce((sum, s) => sum + s.monto, 0)
                },
                secondHalf: {
                    purchases: q2Purchases,
                    sales: q2Sales,
                    totalPurchases: q2Purchases.reduce((sum, p) => sum + p.monto, 0),
                    totalSales: q2Sales.reduce((sum, s) => sum + s.monto, 0)
                }
            }
        });

    } catch (error) {
        console.error('Error en reporte quincenal:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar reporte quincenal'
        });
    }
}

/**
 * Datos para gráficos
 * GET /api/reports/charts
 */
async function getChartData(req, res) {
    try {
        const year = req.query.year || new Date().getFullYear();

        // Ventas y compras por mes
        const monthlyData = await query(
            `SELECT 
                MONTH(fecha) as mes,
                'compra' as tipo,
                SUM(monto) as total
             FROM cab_factura
             WHERE YEAR(fecha) = ?
             GROUP BY MONTH(fecha)
             UNION ALL
             SELECT 
                MONTH(fecha) as mes,
                'venta' as tipo,
                SUM(monto) as total
             FROM cab_salida
             WHERE YEAR(fecha) = ?
             GROUP BY MONTH(fecha)
             ORDER BY mes, tipo`,
            [year, year]
        );

        // Productos más vendidos del año
        const topProducts = await query(
            `SELECT d.nombre, SUM(d.cantidad) as total_vendido
             FROM detalle_salida d
             JOIN cab_salida cs ON d.id = cs.id
             WHERE YEAR(cs.fecha) = ?
             GROUP BY d.codigo_producto, d.nombre
             ORDER BY total_vendido DESC
             LIMIT 5`,
            [year]
        );

        // Mejores clientes del año (LEFT JOIN para asegurar registros aunque el cliente haya sido borrado)
        const topClients = await query(
            `SELECT COALESCE(c.nombre, 'Cliente Eliminado') as nombre, 
                    SUM(cs.monto) as total_compras, 
                    COUNT(*) as transacciones
             FROM cab_salida cs
             LEFT JOIN cliente c ON cs.cedula = c.cedula
             WHERE YEAR(cs.fecha) = ?
             GROUP BY cs.cedula, c.nombre
             ORDER BY total_compras DESC
             LIMIT 5`,
            [year]
        );

        // Proveedores principales del año (LEFT JOIN por seguridad)
        const topProviders = await query(
            `SELECT COALESCE(p.nombre, 'Proveedor Eliminado') as nombre, 
                    SUM(cf.monto) as total_compras, 
                    COUNT(*) as transacciones
             FROM cab_factura cf
             LEFT JOIN proveedor p ON cf.cedula = p.codigo
             WHERE YEAR(cf.fecha) = ?
             GROUP BY cf.cedula, p.nombre
             ORDER BY total_compras DESC
             LIMIT 5`,
            [year]
        );

        // Distribución de productos por stock
        const stockDistribution = await query(
            `SELECT 
                CASE 
                    WHEN cantidad <= min THEN 'Bajo'
                    WHEN cantidad >= max THEN 'Exceso'
                    ELSE 'Normal'
                END as nivel,
                COUNT(*) as cantidad
             FROM producto
             WHERE estado = 1
             GROUP BY nivel`
        );

        // Valor del inventario
        const [inventoryValue] = await query(
            'SELECT COALESCE(SUM(precio * cantidad), 0) as valor FROM producto WHERE estado = 1'
        );

        res.json({
            success: true,
            data: {
                monthlyTransactions: monthlyData,
                topProducts: topProducts || [],
                topClients: topClients || [],
                topProviders: topProviders || [],
                stockDistribution: stockDistribution || [],
                inventoryValue: inventoryValue.valor || 0
            }
        });

    } catch (error) {
        console.error('Error al obtener datos de gráficos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener datos de gráficos'
        });
    }
}

/**
 * Obtener tasa del dólar (BCV)
 * GET /api/reports/dollar-rate
 */
const cheerio = require('cheerio');

// ... (código existente)

/**
 * Obtener tasa del dólar (BCV)
 * GET /api/reports/dollar-rate
 */
async function getDollarRate(req, res) {
    try {
        // Configuración para fetch (timeout de 5s e ignorar SSL si es necesario)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        // Nota: En Node 18+ fetch es nativo. 
        // BCV a veces tiene problemas de SSL, en producción Vercel suele manejarlos bien,
        // pero si falla por certificados locales, se podría necesitar https.Agent (no soportado directamente en fetch estándar).
        // Sin embargo, Vercel usa Node 18/20 donde fetch suele funcionar.

        const response = await fetch('https://www.bcv.org.ve/', {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Selector específico del BCV
        const dolarElement = $('#dolar .col-sm-6.col-xs-6.centrado strong');
        let dolarValue = dolarElement.text().trim();

        // Limpiar y parsear (formato europeo: 62,50 -> 62.50)
        dolarValue = dolarValue.replace(',', '.');
        const rate = parseFloat(dolarValue);

        if (!isNaN(rate) && rate > 0) {
            return res.json({
                success: true,
                rate: rate,
                formatted: rate.toFixed(2),
                source: 'BCV'
            });
        }

        throw new Error('Formato de tasa no válido');

    } catch (error) {
        console.error('Error obteniendo tasa BCV:', error.message);

        // Fallback silencioso: retornar 0 en lugar de error
        console.warn('Usando fallback de tasa (0) por error en scraping');
        res.json({
            success: true, // Marcar como éxito para que el front lo muestre
            rate: 0,
            formatted: '0.00',
            source: 'fallback',
            error: error.message
        });
    }
}

module.exports = {
    getDashboardStats,
    getMonthlyReport,
    getBiweeklyReport,
    getChartData,
    getDollarRate
};
