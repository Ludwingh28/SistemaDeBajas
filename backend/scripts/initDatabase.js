import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const MOTIVOS_INICIALES = [
  'Cierre Definitivo',
  'Cambio de rubro',
  'Cambio de Dueño',
  'Duplicado',
  'Mal punteado',
  'Mudanza',
  'No hay negocio',
  'No hay negocio con ese nombre',
  'Tienda en Alquiler',
  'Otro'
];

async function initDatabase() {
  let connection;

  try {
    console.log('🔧 Iniciando configuración de base de datos...\n');

    // Conectar a MySQL (sin especificar base de datos)
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    console.log('✓ Conectado a MySQL');

    // Crear base de datos si no existe
    const dbName = process.env.DB_NAME || 'sistema_bajas';
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✓ Base de datos '${dbName}' lista`);

    // Usar la base de datos
    await connection.query(`USE ${dbName}`);

    // Crear tabla de motivos
    await connection.query(`
      CREATE TABLE IF NOT EXISTS motivos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL UNIQUE,
        activo BOOLEAN DEFAULT TRUE,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_activo (activo),
        INDEX idx_nombre (nombre)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ Tabla "motivos" creada');

    // Crear tabla de ventas
    await connection.query(`
      CREATE TABLE IF NOT EXISTS ventas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        fecha DATE NOT NULL,
        codigo_cliente VARCHAR(50) NOT NULL,
        nombre_cliente VARCHAR(255) NOT NULL,
        fecha_carga TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_codigo_cliente (codigo_cliente),
        INDEX idx_fecha (fecha),
        INDEX idx_codigo_fecha (codigo_cliente, fecha)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ Tabla "ventas" creada');

    // Crear tabla de clientes
    await connection.query(`
      CREATE TABLE IF NOT EXISTS clientes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        codigo VARCHAR(50) NOT NULL UNIQUE,
        nombre VARCHAR(255) NOT NULL,
        ruta VARCHAR(100),
        zona VARCHAR(100),
        activo BOOLEAN DEFAULT TRUE,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_codigo (codigo),
        INDEX idx_ruta (ruta),
        INDEX idx_activo (activo)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ Tabla "clientes" creada');

    // Crear tabla de reportes
    await connection.query(`
      CREATE TABLE IF NOT EXISTS reportes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        codigo_cliente VARCHAR(50) NOT NULL,
        nombre_cliente VARCHAR(255) NOT NULL,
        motivo VARCHAR(255) NOT NULL,
        zona VARCHAR(100),
        ruta VARCHAR(100),
        vendedor VARCHAR(255),
        resultado ENUM('SI', 'NO', 'MANUAL') NOT NULL,
        razon TEXT,
        fotos_rutas JSON,
        fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_fecha_solicitud (fecha_solicitud),
        INDEX idx_codigo_cliente (codigo_cliente),
        INDEX idx_resultado (resultado),
        INDEX idx_fecha_creacion (fecha_creacion)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ Tabla "reportes" creada');

    // Insertar motivos iniciales
    console.log('\n📝 Insertando motivos iniciales...');
    for (const motivo of MOTIVOS_INICIALES) {
      await connection.query(
        'INSERT INTO motivos (nombre) VALUES (?) ON DUPLICATE KEY UPDATE nombre = VALUES(nombre)',
        [motivo]
      );
    }
    console.log(`✓ ${MOTIVOS_INICIALES.length} motivos insertados`);

    // Mostrar motivos
    const [motivos] = await connection.query('SELECT id, nombre, activo FROM motivos ORDER BY id');
    console.log('\n📋 Motivos en la base de datos:');
    motivos.forEach((m, i) => {
      console.log(`   ${i + 1}. ${m.nombre} ${m.activo ? '✓' : '✗'}`);
    });

    // Verificar tablas
    const [tables] = await connection.query('SHOW TABLES');
    console.log('\n📊 Tablas en la base de datos:');
    tables.forEach((table, i) => {
      console.log(`   ${i + 1}. ${Object.values(table)[0]}`);
    });

    console.log('\n✅ ¡Base de datos inicializada correctamente!\n');

  } catch (error) {
    console.error('\n❌ Error inicializando base de datos:');
    console.error(error.message);
    console.error('\nVerifica que:');
    console.error('1. MySQL esté corriendo');
    console.error('2. Las credenciales en .env sean correctas');
    console.error('3. El usuario tenga permisos para crear bases de datos\n');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Ejecutar
initDatabase();
