/**
 * Script de migración: Agregar columnas para control de inhabilitación
 * Ejecutar con: node scripts/migrate-inhabilitacion.js
 */

async function ejecutarMigracion() {
  // IMPORTANTE: Cargar .env ANTES de importar pool (usando dynamic imports)
  const dotenv = await import('dotenv');
  const path = await import('path');
  const { fileURLToPath } = await import('url');

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  dotenv.config({ path: path.join(__dirname, '../.env') });
  console.log('[ENV] Cargando variables de entorno desde:', path.join(__dirname, '../.env'));

  const { default: pool } = await import('../config/mysql.js');
  console.log('\n' + '='.repeat(60));
  console.log('MIGRACION: Agregar columnas de inhabilitacion a reportes');
  console.log('='.repeat(60) + '\n');

  let connection;

  try {
    connection = await pool.getConnection();
    console.log('[OK] Conexion a MySQL establecida');

    // 1. Agregar columna inhabilitado_dualpoint
    console.log('\n[1/5] Agregando columna inhabilitado_dualpoint...');
    try {
      await connection.query(`
        ALTER TABLE reportes
        ADD COLUMN inhabilitado_dualpoint TINYINT(1) DEFAULT 0
        COMMENT 'Indica si el cliente ya fue movido a ruta genérica en Dualpoint (0=No, 1=Sí)'
      `);
      console.log('   [OK] Columna inhabilitado_dualpoint agregada');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('   [SKIP] Columna inhabilitado_dualpoint ya existe');
      } else {
        throw error;
      }
    }

    // 2. Agregar columna fecha_inhabilitacion
    console.log('\n[2/5] Agregando columna fecha_inhabilitacion...');
    try {
      await connection.query(`
        ALTER TABLE reportes
        ADD COLUMN fecha_inhabilitacion DATETIME NULL
        COMMENT 'Fecha y hora en que el cliente fue inhabilitado en Dualpoint'
      `);
      console.log('   [OK] Columna fecha_inhabilitacion agregada');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('   [SKIP] Columna fecha_inhabilitacion ya existe');
      } else {
        throw error;
      }
    }

    // 3. Agregar columna tipo_ejecucion_inhabilitacion
    console.log('\n[3/5] Agregando columna tipo_ejecucion_inhabilitacion...');
    try {
      await connection.query(`
        ALTER TABLE reportes
        ADD COLUMN tipo_ejecucion_inhabilitacion VARCHAR(20) NULL
        COMMENT 'Tipo de ejecución: MANUAL o AUTOMATICA'
      `);
      console.log('   [OK] Columna tipo_ejecucion_inhabilitacion agregada');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('   [SKIP] Columna tipo_ejecucion_inhabilitacion ya existe');
      } else {
        throw error;
      }
    }

    // 4. Agregar columna ejecutado_por_inhabilitacion
    console.log('\n[4/5] Agregando columna ejecutado_por_inhabilitacion...');
    try {
      await connection.query(`
        ALTER TABLE reportes
        ADD COLUMN ejecutado_por_inhabilitacion VARCHAR(100) NULL
        COMMENT 'Usuario que ejecutó la inhabilitación (solo para ejecuciones MANUAL)'
      `);
      console.log('   [OK] Columna ejecutado_por_inhabilitacion agregada');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('   [SKIP] Columna ejecutado_por_inhabilitacion ya existe');
      } else {
        throw error;
      }
    }

    // 5. Crear índice
    console.log('\n[5/5] Creando índice idx_inhabilitacion...');
    try {
      await connection.query(`
        CREATE INDEX idx_inhabilitacion
        ON reportes(estado_aprobacion, inhabilitado_dualpoint, fecha_aprobacion)
      `);
      console.log('   [OK] Indice idx_inhabilitacion creado');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('   [SKIP] Indice idx_inhabilitacion ya existe');
      } else if (error.errno === 1072) {
        // En producción la columna puede tener nombre diferente — el índice es solo optimización
        console.log('   [SKIP] No se pudo crear el índice (columna con nombre distinto en producción)');
        console.log('          Esto no afecta el funcionamiento del sistema');
      } else {
        throw error;
      }
    }

    // Verificar estructura
    console.log('\n[VERIFICACION] Consultando estructura de la tabla...');
    const [columns] = await connection.query(`
      DESCRIBE reportes
    `);

    const columnas_inhabilitacion = columns.filter(col =>
      col.Field.includes('inhabilitacion') || col.Field === 'inhabilitado_dualpoint'
    );

    console.log('\nColumnas de inhabilitación:');
    columnas_inhabilitacion.forEach(col => {
      console.log(`   - ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });

    // Contar clientes pendientes
    const [pendientes] = await connection.query(`
      SELECT COUNT(*) as total
      FROM reportes
      WHERE estado_aprobacion = 'APROBADO'
        AND (inhabilitado_dualpoint IS NULL OR inhabilitado_dualpoint = 0)
    `);

    console.log('\n' + '='.repeat(60));
    console.log('RESUMEN');
    console.log('='.repeat(60));
    console.log(`Clientes aprobados pendientes de inhabilitar: ${pendientes[0].total}`);
    console.log('='.repeat(60) + '\n');

    console.log('[OK] Migracion completada exitosamente\n');

  } catch (error) {
    console.error('\n[ERROR] Error en la migracion:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      connection.release();
      console.log('[OK] Conexion cerrada');
    }
    process.exit(0);
  }
}

// Ejecutar migración
ejecutarMigracion();
