/**
 * Aplicación Principal - Digital Stock Web
 * Sistema de Inventario
 * 
 * Servidor Express con API REST para gestión de inventario
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

// Importar configuración de base de datos
const { testConnection } = require('./config/database');

// Importar rutas
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const clientRoutes = require('./routes/clients');
const providerRoutes = require('./routes/providers');
const userRoutes = require('./routes/users');
const purchaseRoutes = require('./routes/purchases');
const saleRoutes = require('./routes/sales');
const reportRoutes = require('./routes/reports');
const logRoutes = require('./routes/logs');

// Crear aplicación Express
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE
// ============================================

// Seguridad HTTP headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            scriptSrcAttr: ["'unsafe-inline'"],
            connectSrc: ["'self'", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

// CORS - Permitir solicitudes desde el mismo origen
app.use(cors({
    origin: true,
    credentials: true
}));

// Parsear JSON y URL-encoded
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, '..', 'public')));

// ============================================
// RUTAS API
// ============================================

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/users', userRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/logs', logRoutes);

// ============================================
// RUTAS DE PÁGINAS
// ============================================

// Redirigir raíz a index (landing page)
app.get('/', (req, res) => {
    res.sendFile('index.html', { root: path.join(__dirname, '..', 'public') });
});

// Manejar rutas no encontradas (404)
app.use((req, res) => {
    // Si es una petición API, devolver JSON
    if (req.path.startsWith('/api')) {
        return res.status(404).json({
            success: false,
            message: 'Endpoint no encontrado'
        });
    }
    // Si es una página, redirigir a login
    res.redirect('/pages/login.html');
});

// ============================================
// MANEJO DE ERRORES GLOBAL
// ============================================

app.use((err, req, res, next) => {
    console.error('Error del servidor:', err);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ============================================
// INICIAR SERVIDOR
// ============================================

async function startServer() {
    // Probar conexión a base de datos
    const dbConnected = await testConnection();

    if (!dbConnected) {
        console.error('⚠ Advertencia: No se pudo conectar a la base de datos');
        console.log('  Asegúrese de que MySQL/MariaDB esté en ejecución');
        console.log('  y que las credenciales en .env sean correctas');
    }

    // Iniciar servidor
    app.listen(PORT, () => {
        console.log('═══════════════════════════════════════════════');
        console.log('   DIGITAL STOCK WEB - Sistema de Inventario');
        console.log('═══════════════════════════════════════════════');
        console.log(`   Servidor: http://localhost:${PORT}`);
        console.log(`   Entorno:  ${process.env.NODE_ENV || 'development'}`);
        console.log('═══════════════════════════════════════════════');
    });
}

// Iniciar servidor solo si se ejecuta directamente (no en modo test/importación)
if (require.main === module) {
    startServer();
}

module.exports = app;
