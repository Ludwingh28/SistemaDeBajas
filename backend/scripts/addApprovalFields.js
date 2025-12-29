import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '../.env') });

async function addApprovalFields() {
  console.log('\n📊 ========== AGREGANDO CAMPOS DE APROBACIÓN MANUAL ==========\n');

  let connection;

  try {
    // Crear conexión a la base de datos
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'cruzimex_bajas',
      multipleStatements: true // Permitir múltiples statements
    });

    console.log('✓ Conexión a la base de datos establecida\n');

    // Leer archivo SQL
    const sqlPath = path.join(__dirname, '../migrations/20251223_add_approval_fields.sql');
    const sql = await fs.readFile(sqlPath, 'utf8');

    console.log('📝 Ejecutando migración...\n');

    // Ejecutar migración
    await connection.query(sql);

    console.log('✓ Campos agregados exitosamente\n');

    // Verificar estructura
    console.log('📊 Verificando nueva estructura...\n');
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_DEFAULT, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'reportes'
      AND COLUMN_NAME IN ('supervisor_aprobador', 'fecha_aprobacion', 'comentario_aprobacion', 'estado_aprobacion')
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME || 'cruzimex_bajas']);

    console.log('Nuevos campos en tabla reportes:\n');
    columns.forEach(col => {
      console.log(`   ✓ ${col.COLUMN_NAME}: ${col.COLUMN_TYPE} ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'} (Default: ${col.COLUMN_DEFAULT || 'NONE'})`);
    });

    console.log('\n✅ ========== MIGRACIÓN COMPLETADA ==========\n');
    console.log('Los siguientes campos han sido agregados a la tabla "reportes":');
    console.log('  - supervisor_aprobador: Nombre del supervisor que aprobó/rechazó');
    console.log('  - fecha_aprobacion: Fecha y hora de aprobación/rechazo');
    console.log('  - comentario_aprobacion: Comentario opcional del supervisor');
    console.log('  - estado_aprobacion: Estado (PENDIENTE, APROBADO, RECHAZADO)\n');
    console.log('Siguiente paso: Reinicia el servidor backend para aplicar cambios\n');

  } catch (error) {
    console.error('\n❌ Error ejecutando migración:', error.message);

    // Si el error es porque las columnas ya existen, informar
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('\n⚠️  Los campos ya existen en la base de datos. No se requiere acción.\n');
    } else {
      console.error('\nDetalles del error:', error);
      process.exit(1);
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('✓ Conexión cerrada\n');
    }
  }
}

// Ejecutar migración
addApprovalFields();
