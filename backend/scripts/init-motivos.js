/**
 * Script para inicializar motivos en la base de datos
 * Ejecutar con: node scripts/init-motivos.js
 */

async function inicializarMotivos() {
  // Cargar .env ANTES de importar pool (usando dynamic imports)
  const dotenv = await import('dotenv');
  const path = await import('path');
  const { fileURLToPath } = await import('url');

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  dotenv.config({ path: path.join(__dirname, '../.env') });
  console.log('[ENV] Cargando variables de entorno desde:', path.join(__dirname, '../.env'));

  const { default: pool } = await import('../config/mysql.js');

  console.log('\n' + '='.repeat(60));
  console.log('INICIALIZACION: Motivos de Baja');
  console.log('='.repeat(60) + '\n');

  let connection;

  try {
    connection = await pool.getConnection();
    console.log('[OK] Conexion a MySQL establecida\n');

    // Motivos iniciales
    const motivosIniciales = [
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

    console.log('[1/2] Verificando motivos existentes...');
    const [motivosExistentes] = await connection.query('SELECT nombre FROM motivos');
    const nombresExistentes = motivosExistentes.map(m => m.nombre);

    console.log(`   Motivos en BD: ${motivosExistentes.length}`);

    console.log('\n[2/2] Insertando motivos faltantes...');
    let insertados = 0;
    let omitidos = 0;

    for (const motivo of motivosIniciales) {
      if (!nombresExistentes.includes(motivo)) {
        try {
          await connection.query(
            'INSERT INTO motivos (nombre) VALUES (?)',
            [motivo]
          );
          console.log(`   [OK] Insertado: ${motivo}`);
          insertados++;
        } catch (error) {
          if (error.code === 'ER_DUP_ENTRY') {
            console.log(`   [SKIP] Ya existe: ${motivo}`);
            omitidos++;
          } else {
            throw error;
          }
        }
      } else {
        console.log(`   [SKIP] Ya existe: ${motivo}`);
        omitidos++;
      }
    }

    // Verificación final
    console.log('\n[VERIFICACION] Consultando motivos en BD...');
    const [todosMotivos] = await connection.query(
      'SELECT id, nombre, activo FROM motivos ORDER BY nombre ASC'
    );

    console.log('\n' + '='.repeat(60));
    console.log('RESUMEN');
    console.log('='.repeat(60));
    console.log(`Motivos insertados: ${insertados}`);
    console.log(`Motivos omitidos: ${omitidos}`);
    console.log(`Total en BD: ${todosMotivos.length}`);
    console.log('='.repeat(60));

    console.log('\nMotivos actuales:');
    todosMotivos.forEach(m => {
      const estado = m.activo ? '✓ ACTIVO' : '✗ INACTIVO';
      console.log(`   ${m.id}. ${m.nombre} - ${estado}`);
    });

    console.log('\n[OK] Inicializacion completada exitosamente\n');

  } catch (error) {
    console.error('\n[ERROR] Error en la inicializacion:', error.message);
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

// Ejecutar inicialización
inicializarMotivos();
