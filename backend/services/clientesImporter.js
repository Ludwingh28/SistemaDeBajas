import ExcelJS from 'exceljs';
import Cliente from '../models/Cliente.js';

/**
 * Procesa un archivo Excel usando STREAMING (para archivos grandes)
 * Inserta directamente a la base de datos en batches sin cargar todo en memoria
 * @param {string} filePath - Ruta al archivo Excel
 * @param {string} sheetName - Nombre de la hoja
 * @param {number} headerRow - Fila donde están los headers
 * @param {boolean} reemplazar - Si true, trunca la tabla antes de insertar
 * @returns {Promise<Object>} Resultado de la importación
 */
async function procesarExcelClientesStreaming(filePath, sheetName = 'clientes', headerRow = 5, reemplazar = false) {
  try {
    console.log(`📖 Procesando Excel con streaming: ${filePath} (hoja: ${sheetName})`);

    // Si reemplazar, truncar tabla primero
    if (reemplazar) {
      console.log('⚠️  Reemplazando todos los datos de clientes...');
      await Cliente.truncate();
    }

    const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader(filePath, {
      sharedStrings: 'cache',
      hyperlinks: 'ignore',
      worksheets: 'emit'
    });

    let headers = [];
    let batch = [];
    let totalProcesados = 0;
    let totalInsertados = 0;
    const BATCH_SIZE = 1000;
    let targetSheetFound = false;

    for await (const worksheetReader of workbookReader) {
      // Buscar la hoja correcta
      if (worksheetReader.name !== sheetName) {
        continue;
      }

      targetSheetFound = true;
      console.log(`   ✓ Hoja "${sheetName}" encontrada`);

      let rowNumber = 0;

      for await (const row of worksheetReader) {
        rowNumber++;

        // Leer headers
        if (rowNumber === headerRow) {
          headers = row.values.map(h => h?.toString().trim() || '');
          console.log(`   ✓ Headers encontrados en fila ${headerRow}`);
          continue;
        }

        // Procesar datos
        if (rowNumber > headerRow && headers.length > 0) {
          const rowData = {};
          row.values.forEach((cellValue, colNumber) => {
            const header = headers[colNumber];
            if (header) {
              rowData[header] = cellValue;
            }
          });

          // Extraer datos necesarios: CODIGO, NOMBRE, RUTA, ZONA, ACTIVO
          const codigo = rowData['CODIGO'];
          const nombre = rowData['NOMBRE'];
          const ruta = rowData['RUTA'];
          const zona = rowData['ZONA'];
          const activo = rowData['ACTIVO'];

          if (codigo) {
            batch.push({
              codigo: codigo.toString().trim(),
              nombre: nombre?.toString().trim() || '',
              ruta: ruta?.toString().trim() || '',
              zona: zona?.toString().trim() || '',
              activo: activo === true || activo === 1 || activo === 'TRUE' || activo === 'true'
            });

            totalProcesados++;

            // Insertar batch cuando alcance el tamaño
            if (batch.length >= BATCH_SIZE) {
              await Cliente.insertBatch(batch);
              totalInsertados += batch.length;
              console.log(`   ⏳ Procesados ${totalInsertados} clientes...`);
              batch = []; // Limpiar batch
            }
          }
        }
      }

      // Insertar último batch si quedó algo
      if (batch.length > 0) {
        await Cliente.insertBatch(batch);
        totalInsertados += batch.length;
        console.log(`   ⏳ Procesados ${totalInsertados} clientes (final)`);
      }
    }

    if (!targetSheetFound) {
      throw new Error(`Hoja "${sheetName}" no encontrada en el Excel`);
    }

    console.log(`✓ Total procesados: ${totalProcesados} clientes`);
    console.log(`✓ Total insertados: ${totalInsertados} clientes`);

    return {
      procesados: totalProcesados,
      insertados: totalInsertados
    };

  } catch (error) {
    console.error('Error procesando Excel de clientes con streaming:', error);
    throw error;
  }
}

/**
 * Importa clientes desde Excel a MySQL usando STREAMING
 * @param {string} filePath - Ruta al archivo Excel
 * @param {boolean} reemplazar - Si true, reemplaza todos los datos. Si false, actualiza/agrega
 * @returns {Promise<Object>} Resultado de la importación
 */
export async function importarClientesDesdeExcel(filePath, reemplazar = false) {
  try {
    console.log('\n🔄 Iniciando importación de clientes (modo streaming)...');

    // Procesar con streaming (inserta directamente sin cargar todo en memoria)
    const resultado = await procesarExcelClientesStreaming(filePath, 'clientes', 5, reemplazar);

    if (resultado.insertados === 0) {
      return {
        success: false,
        message: 'No se encontraron clientes en el archivo',
        registros: 0
      };
    }

    // Verificar resultados
    const stats = await Cliente.getEstadisticas();

    console.log('\n✅ Importación de clientes completada:');
    console.log(`   📊 Registros procesados: ${resultado.procesados}`);
    console.log(`   📊 Total en BD: ${stats.total}`);
    console.log(`   ✅ Activos: ${stats.activos}`);
    console.log(`   ❌ Inactivos: ${stats.inactivos}`);
    console.log(`   📍 Zonas: ${stats.total_zonas}`);
    console.log(`   🛣️  Rutas: ${stats.total_rutas}\n`);

    return {
      success: true,
      message: 'Clientes importados correctamente (streaming)',
      registros: resultado.insertados,
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
  importarClientesDesdeExcel
};
