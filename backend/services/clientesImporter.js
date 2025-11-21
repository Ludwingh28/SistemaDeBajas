import ExcelJS from 'exceljs';
import Cliente from '../models/Cliente.js';

/**
 * Procesa un archivo Excel y extrae clientes
 * @param {string} filePath - Ruta al archivo Excel
 * @param {string} sheetName - Nombre de la hoja
 * @param {number} headerRow - Fila donde están los headers
 * @returns {Promise<Array>} Array de clientes
 */
async function procesarExcelClientes(filePath, sheetName = 'clientes', headerRow = 5) {
  try {
    console.log(`📖 Procesando Excel: ${filePath} (hoja: ${sheetName})`);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const worksheet = workbook.getWorksheet(sheetName);
    if (!worksheet) {
      throw new Error(`Hoja "${sheetName}" no encontrada`);
    }

    const clientes = [];
    let headers = [];

    worksheet.eachRow((row, rowNumber) => {
      // Leer headers
      if (rowNumber === headerRow) {
        headers = row.values.map(h => h?.toString().trim() || '');
        return;
      }

      // Procesar datos
      if (rowNumber > headerRow) {
        const rowData = {};
        row.values.forEach((cellValue, colNumber) => {
          const header = headers[colNumber];
          if (header) {
            rowData[header] = cellValue;
          }
        });

        // Extraer: CODIGO, NOMBRE, RUTA, ZONA, ACTIVO
        const codigo = rowData['CODIGO'];
        const nombre = rowData['NOMBRE'];
        const ruta = rowData['RUTA'];
        const zona = rowData['ZONA'];
        const activo = rowData['ACTIVO'];

        if (codigo) {
          clientes.push({
            codigo: codigo.toString().trim(),
            nombre: nombre?.toString().trim() || '',
            ruta: ruta?.toString().trim() || '',
            zona: zona?.toString().trim() || '',
            activo: activo === true || activo === 1 || activo === 'TRUE' || activo === 'true'
          });
        }
      }
    });

    console.log(`✓ ${clientes.length} clientes procesados desde Excel`);
    return clientes;
  } catch (error) {
    console.error('Error procesando Excel de clientes:', error);
    throw error;
  }
}

/**
 * Importa clientes desde Excel a MySQL
 * @param {string} filePath - Ruta al archivo Excel
 * @param {boolean} reemplazar - Si true, reemplaza todos los datos. Si false, actualiza/agrega
 * @returns {Promise<Object>} Resultado de la importación
 */
export async function importarClientesDesdeExcel(filePath, reemplazar = false) {
  try {
    console.log('\n🔄 Iniciando importación de clientes...');

    // 1. Procesar Excel
    const clientes = await procesarExcelClientes(filePath);

    if (clientes.length === 0) {
      return {
        success: false,
        message: 'No se encontraron clientes en el archivo',
        registros: 0
      };
    }

    // 2. Si reemplazar, truncar tabla
    if (reemplazar) {
      console.log('⚠️  Reemplazando todos los datos de clientes...');
      await Cliente.truncate();
    }

    // 3. Insertar en la base de datos en batches (más eficiente)
    const BATCH_SIZE = 1000;
    let totalInsertados = 0;

    for (let i = 0; i < clientes.length; i += BATCH_SIZE) {
      const batch = clientes.slice(i, i + BATCH_SIZE);
      await Cliente.insertBatch(batch);
      totalInsertados += batch.length;
      console.log(`   ⏳ Procesados ${totalInsertados}/${clientes.length}...`);
    }

    // 4. Verificar resultados
    const stats = await Cliente.getEstadisticas();

    console.log('\n✅ Importación de clientes completada:');
    console.log(`   📊 Registros procesados: ${totalInsertados}`);
    console.log(`   📊 Total en BD: ${stats.total}`);
    console.log(`   ✅ Activos: ${stats.activos}`);
    console.log(`   ❌ Inactivos: ${stats.inactivos}`);
    console.log(`   📍 Zonas: ${stats.total_zonas}`);
    console.log(`   🛣️  Rutas: ${stats.total_rutas}\n`);

    return {
      success: true,
      message: 'Clientes importados correctamente',
      registros: totalInsertados,
      estadisticas: stats
    };
  } catch (error) {
    console.error('❌ Error en importación de clientes:', error);
    return {
      success: false,
      message: error.message,
      registros: 0
    };
  }
}

export default {
  importarClientesDesdeExcel,
  procesarExcelClientes
};
