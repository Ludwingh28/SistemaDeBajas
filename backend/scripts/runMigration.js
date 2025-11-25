import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '../.env') });

async function runMigration() {
  console.log('\n🔄 ========== EJECUTANDO MIGRACIÓN DE BASE DE DATOS ==========\n');

  let connection;

  try {
    // Crear conexión a la base de datos
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'cruzimex_bajas',
      multipleStatements: false // Importante: desactivar múltiples statements
    });

    console.log('✓ Conexión a la base de datos establecida\n');

    // PASO 0: Convertir colación de tabla existente
    console.log('📝 Paso 1/6: Convirtiendo colación de tabla existente...');
    await connection.query('ALTER TABLE planificacion_rutas CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    console.log('   ✓ Colación convertida\n');

    // PASO 1: Crear tablas nuevas
    console.log('📝 Paso 2/6: Creando tablas normalizadas...');

    // Tabla zonas
    await connection.query(`
      CREATE TABLE IF NOT EXISTS zonas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        codigo VARCHAR(50) UNIQUE NOT NULL COLLATE utf8mb4_unicode_ci,
        nombre VARCHAR(100) NOT NULL COLLATE utf8mb4_unicode_ci,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_codigo (codigo)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Tabla vendedores
    await connection.query(`
      CREATE TABLE IF NOT EXISTS vendedores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre_completo VARCHAR(150) NOT NULL COLLATE utf8mb4_unicode_ci,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        activo BOOLEAN DEFAULT TRUE,
        INDEX idx_nombre (nombre_completo)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Tabla dias
    await connection.query(`
      CREATE TABLE IF NOT EXISTS dias (
        id INT AUTO_INCREMENT PRIMARY KEY,
        codigo VARCHAR(10) UNIQUE NOT NULL COLLATE utf8mb4_unicode_ci,
        nombre VARCHAR(20) NOT NULL COLLATE utf8mb4_unicode_ci,
        orden INT NOT NULL,
        INDEX idx_codigo (codigo),
        INDEX idx_orden (orden)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Insertar días
    await connection.query(`
      INSERT INTO dias (codigo, nombre, orden) VALUES
      ('1-LU', 'Lunes', 1),
      ('2-MA', 'Martes', 2),
      ('3-MI', 'Miércoles', 3),
      ('4-JU', 'Jueves', 4),
      ('5-VI', 'Viernes', 5),
      ('6-SA', 'Sábado', 6)
      ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), orden = VALUES(orden)
    `);

    // Tabla rutas
    await connection.query(`
      CREATE TABLE IF NOT EXISTS rutas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        codigo VARCHAR(100) UNIQUE NOT NULL COLLATE utf8mb4_unicode_ci,
        zona_id INT NOT NULL,
        vendedor_id INT NULL,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_codigo (codigo),
        INDEX idx_zona (zona_id),
        INDEX idx_vendedor (vendedor_id),
        FOREIGN KEY (zona_id) REFERENCES zonas(id) ON DELETE RESTRICT,
        FOREIGN KEY (vendedor_id) REFERENCES vendedores(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Tabla rutas_dias
    await connection.query(`
      CREATE TABLE IF NOT EXISTS rutas_dias (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ruta_id INT NOT NULL,
        dia_id INT NOT NULL,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_ruta_dia (ruta_id, dia_id),
        INDEX idx_ruta (ruta_id),
        INDEX idx_dia (dia_id),
        FOREIGN KEY (ruta_id) REFERENCES rutas(id) ON DELETE CASCADE,
        FOREIGN KEY (dia_id) REFERENCES dias(id) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('   ✓ Tablas creadas\n');

    // PASO 2: Migrar datos
    console.log('📝 Paso 3/6: Migrando datos de tabla antigua...');

    // Migrar zonas
    await connection.query(`
      INSERT INTO zonas (codigo, nombre)
      SELECT DISTINCT zona as codigo, zona as nombre
      FROM planificacion_rutas
      WHERE zona IS NOT NULL AND zona != ''
      ON DUPLICATE KEY UPDATE nombre = VALUES(nombre)
    `);

    // Migrar vendedores
    await connection.query(`
      INSERT INTO vendedores (nombre_completo)
      SELECT DISTINCT vendedor
      FROM planificacion_rutas
      WHERE vendedor IS NOT NULL AND vendedor != ''
      ON DUPLICATE KEY UPDATE nombre_completo = VALUES(nombre_completo)
    `);

    // Migrar rutas
    await connection.query(`
      INSERT INTO rutas (codigo, zona_id, vendedor_id)
      SELECT DISTINCT
        pr.ruta as codigo,
        z.id as zona_id,
        v.id as vendedor_id
      FROM planificacion_rutas pr
      INNER JOIN zonas z ON pr.zona COLLATE utf8mb4_unicode_ci = z.codigo
      LEFT JOIN vendedores v ON pr.vendedor COLLATE utf8mb4_unicode_ci = v.nombre_completo
      WHERE pr.ruta IS NOT NULL AND pr.ruta != ''
      ON DUPLICATE KEY UPDATE
        zona_id = VALUES(zona_id),
        vendedor_id = VALUES(vendedor_id)
    `);

    // Migrar relaciones rutas-días
    await connection.query(`
      INSERT INTO rutas_dias (ruta_id, dia_id)
      SELECT DISTINCT
        r.id as ruta_id,
        d.id as dia_id
      FROM planificacion_rutas pr
      INNER JOIN rutas r ON pr.ruta COLLATE utf8mb4_unicode_ci = r.codigo
      INNER JOIN dias d ON pr.dia COLLATE utf8mb4_unicode_ci = d.codigo
      WHERE pr.ruta IS NOT NULL AND pr.ruta != ''
        AND pr.dia IS NOT NULL AND pr.dia != ''
      ON DUPLICATE KEY UPDATE ruta_id = VALUES(ruta_id)
    `);

    console.log('   ✓ Datos migrados\n');

    // PASO 3: Renombrar tabla antigua
    console.log('📝 Paso 4/6: Respaldando tabla antigua...');
    await connection.query('RENAME TABLE planificacion_rutas TO planificacion_rutas_backup_old');
    console.log('   ✓ Tabla respaldada\n');

    // PASO 4: Crear vista
    console.log('📝 Paso 5/6: Creando vista de compatibilidad...');
    await connection.query(`
      CREATE OR REPLACE VIEW planificacion_rutas AS
      SELECT
        r.id,
        r.codigo as ruta,
        z.codigo as zona,
        d.codigo as dia,
        COALESCE(v.nombre_completo, '') as vendedor,
        r.fecha_actualizacion as fecha_sincronizacion
      FROM rutas r
      INNER JOIN zonas z ON r.zona_id = z.id
      LEFT JOIN vendedores v ON r.vendedor_id = v.id
      INNER JOIN rutas_dias rd ON r.id = rd.ruta_id
      INNER JOIN dias d ON rd.dia_id = d.id
      ORDER BY z.codigo, d.orden, r.codigo
    `);
    console.log('   ✓ Vista creada\n');

    // PASO 5: Verificar resultados
    console.log('📝 Paso 6/6: Verificando datos migrados...\n');

    const [zonas] = await connection.query('SELECT COUNT(*) as total FROM zonas');
    const [vendedores] = await connection.query('SELECT COUNT(*) as total FROM vendedores');
    const [dias] = await connection.query('SELECT COUNT(*) as total FROM dias');
    const [rutas] = await connection.query('SELECT COUNT(*) as total FROM rutas');
    const [rutasDias] = await connection.query('SELECT COUNT(*) as total FROM rutas_dias');
    const [vista] = await connection.query('SELECT COUNT(*) as total FROM planificacion_rutas');

    console.log('📊 Resumen de datos migrados:\n');
    console.log(`   Zonas: ${zonas[0].total}`);
    console.log(`   Vendedores: ${vendedores[0].total}`);
    console.log(`   Días: ${dias[0].total}`);
    console.log(`   Rutas: ${rutas[0].total}`);
    console.log(`   Rutas-Días (relaciones): ${rutasDias[0].total}`);
    console.log(`   Vista planificacion_rutas: ${vista[0].total}`);
    console.log('');

    console.log('✅ ========== MIGRACIÓN COMPLETADA ==========\n');
    console.log('Siguiente paso: Reinicia el servidor backend y ejecuta la sincronización');
    console.log('desde la interfaz web usando el botón "Migración Inicial"\n');

  } catch (error) {
    console.error('\n❌ Error ejecutando migración:', error.message);
    console.error('\nDetalles del error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('✓ Conexión cerrada\n');
    }
  }
}

// Ejecutar migración
runMigration();
