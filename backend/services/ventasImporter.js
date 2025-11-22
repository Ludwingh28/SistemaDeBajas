import ExcelJS from 'exceljs';
import Venta from '../models/Venta.js';

/**
 * Procesa un archivo Excel usando STREAMING (para archivos grandes)
 * Inserta directamente a la base de datos en batches sin cargar todo en memoria
 * @param {string} filePath - Ruta al archivo Excel
 * @param {string} sheetName - Nombre de la hoja
 * @param {number} headerRow - Fila donde están los headers
 * @param {boolean} reemplazar - Si true, trunca la tabla antes de insertar
 * @returns {Promise<Object>} Resultado de la importación
 */
async function procesarExcelVentasStreaming(filePath, sheetName = 'VentasPOD', headerRow = 4, reemplazar = false) {
  try {
    console.log(`📖 Procesando Excel con streaming: ${filePath}`);

    // Si reemplazar, truncar tabla primero
    if (reemplazar) {
      console.log('⚠️  Reemplazando todos los datos de ventas...');
      await Venta.truncate();
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

          // Extraer datos necesarios
          const fecha = rowData['Fecha'];
          const codigoCliente = rowData['Cliente'];
          const nombreCliente = rowData['Nombre Cliente'];

          if (fecha && codigoCliente) {
            // Convertir fecha
            let fechaFormateada;
            if (fecha instanceof Date) {
              fechaFormateada = fecha.toISOString().split('T')[0];
            } else if (typeof fecha === 'number') {
              // Excel serial number: días desde 1900-01-01
              // Excel bug: cuenta 1900 como año bisiesto, por eso restamos 2
              const excelEpoch = new Date(1900, 0, 1);
              const jsDate = new Date(excelEpoch.getTime() + (fecha - 2) * 86400000);
              fechaFormateada = jsDate.toISOString().split('T')[0];
            } else if (typeof fecha === 'string') {
              const parsedDate = new Date(fecha);
              if (!isNaN(parsedDate)) {
                fechaFormateada = parsedDate.toISOString().split('T')[0];
              }
            }

            if (fechaFormateada) {
              batch.push({
                fecha: fechaFormateada,
                codigo_cliente: codigoCliente.toString().trim(),
                nombre_cliente: nombreCliente?.toString().trim() || ''
              });

              totalProcesados++;

              // Insertar batch cuando alcance el tamaño
              if (batch.length >= BATCH_SIZE) {
                await Venta.insertBatch(batch);
                totalInsertados += batch.length;
                console.log(`   ⏳ Insertados ${totalInsertados} registros...`);
                batch = []; // Limpiar batch
              }
            }
          }
        }
      }

      // Insertar último batch si quedó algo
      if (batch.length > 0) {
        await Venta.insertBatch(batch);
        totalInsertados += batch.length;
        console.log(`   ⏳ Insertados ${totalInsertados} registros (final)`);
      }
    }

    if (!targetSheetFound) {
      throw new Error(`Hoja "${sheetName}" no encontrada en el Excel`);
    }

    console.log(`✓ Total procesados: ${totalProcesados} ventas`);
    console.log(`✓ Total insertados: ${totalInsertados} ventas`);

    return {
      procesados: totalProcesados,
      insertados: totalInsertados
    };

  } catch (error) {
    console.error('Error procesando Excel con streaming:', error);
    throw error;
  }
}

/**
 * Importa ventas desde Excel a MySQL usando STREAMING
 * @param {string} filePath - Ruta al archivo Excel
 * @param {boolean} reemplazar - Si true, reemplaza todos los datos. Si false, solo agrega
 * @returns {Promise<Object>} Resultado de la importación
 */
export async function importarVentasDesdeExcel(filePath, reemplazar = false) {
  try {
    console.log('\n🔄 Iniciando importación de ventas (modo streaming)...');

    // Procesar con streaming (inserta directamente sin cargar todo en memoria)
    const resultado = await procesarExcelVentasStreaming(filePath, 'VentasPOD', 4, reemplazar);

    if (resultado.insertados === 0) {
      return {
        success: false,
        message: 'No se encontraron ventas en el archivo',
        registros: 0
      };
    }

    // Verificar resultados
    const rangoFechas = await Venta.getRangoFechas();

    console.log('\n✅ Importación de ventas completada:');
    console.log(`   📊 Registros procesados: ${resultado.procesados}`);
    console.log(`   📊 Registros insertados: ${resultado.insertados}`);
    console.log(`   📅 Rango de fechas: ${rangoFechas.min_fecha} a ${rangoFechas.max_fecha}`);
    console.log(`   📆 Días con ventas: ${rangoFechas.dias}\n`);

    return {
      success: true,
      message: 'Ventas importadas correctamente (streaming)',
      registros: resultado.insertados,
      rangoFechas: rangoFechas
    };
  } catch (error) {
    console.error('❌ Error en importación:', error);
    return {
      success: false,
      message: error.message,
      registros: 0
    };
  }
}

export default {
  importarVentasDesdeExcel
};
