/**
 * Script de migración para tabla Clientes
 * Agrega la columna 'estado' para eliminación lógica
 * 
 * Uso: node scripts/migration_clients.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
    const config = {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'digital-stock'
    };

    let connection;

    try {
        console.log('Conectando a la base de datos...');
        connection = await mysql.createConnection(config);

        console.log('Verificando columna "estado" en tabla "cliente"...');

        // Verificar si la columna ya existe
        const [columns] = await connection.execute(
            `SHOW COLUMNS FROM cliente LIKE 'estado'`
        );

        if (columns.length > 0) {
            console.log('⚠ La columna "estado" ya existe. No se requieren cambios.');
        } else {
            console.log('Agregando columna "estado"...');
            await connection.execute(
                `ALTER TABLE cliente ADD COLUMN estado TINYINT(1) NOT NULL DEFAULT 1 AFTER email`
            );
            console.log('✅ Columna "estado" agregada correctamente.');
        }

    } catch (error) {
        console.error('❌ Error durante la migración:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
