/**
 * Configuración de conexión a la base de datos MySQL
 * Digital Stock Web - Sistema de Inventario
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * Pool de conexiones a MySQL
 * Utiliza variables de entorno para la configuración
 */
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'digital-stock',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

/**
 * Prueba la conexión a la base de datos
 * @returns {Promise<boolean>} true si la conexión es exitosa
 */
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✓ Conexión a MySQL establecida correctamente');
        connection.release();
        return true;
    } catch (error) {
        console.error('✗ Error al conectar con MySQL:', error.message);
        return false;
    }
}

/**
 * Ejecuta una consulta SQL
 * @param {string} sql - Consulta SQL
 * @param {Array} params - Parámetros de la consulta
 * @returns {Promise<Array>} Resultados de la consulta
 */
async function query(sql, params = []) {
    try {
        const [results] = await pool.execute(sql, params);
        return results;
    } catch (error) {
        console.error('Error en consulta SQL:', error.message);
        throw error;
    }
}

module.exports = {
    pool,
    query,
    testConnection
};
