import ExcelJS from 'exceljs';
import Venta from '../models/Venta.js';

/**
 * Procesa un archivo Excel y extrae ventas
 * @param {string} filePath - Ruta al archivo Excel
 * @param {string} sheetName - Nombre de la hoja
 * @param {number} headerRow - Fila donde están los headers
 * @returns {Promise<Array>} Array de ventas
 */
async function procesarExcelVentas(filePath, sheetName = 'VentasPOD', headerRow = 4) {
  try {
    console.log(`📖 Procesando Excel: ${filePath}`);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const worksheet = workbook.getWorksheet(sheetName);
    if (!worksheet) {
      throw new Error(`Hoja "${sheetName}" no encontrada`);
    }

    const ventas = [];
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

        // Extraer solo: Fecha, Cliente (código), Nombre Cliente
        const fecha = rowData['Fecha'];
        const codigoCliente = rowData['Cliente'];
        const nombreCliente = rowData['Nombre Cliente'];

        if (fecha && codigoCliente) {
          // Convertir fecha a formato YYYY-MM-DD
          let fechaFormateada;
          if (fecha instanceof Date) {
            fechaFormateada = fecha.toISOString().split('T')[0];
          } else if (typeof fecha === 'string') {
            // Intentar parsear string de fecha
            const parsedDate = new Date(fecha);
            if (!isNaN(parsedDate)) {
              fechaFormateada = parsedDate.toISOString().split('T')[0];
            }
          }

          if (fechaFormateada) {
            ventas.push({
              fecha: fechaFormateada,
              codigo_cliente: codigoCliente.toString().trim(),
              nombre_cliente: nombreCliente?.toString().trim() || ''
            });
          }
        }
      }
    });

    console.log(`✓ ${ventas.length} ventas procesadas desde Excel`);
    return ventas;
  } catch (error) {
    console.error('Error procesando Excel:', error);
    throw error;
  }
}

/**
 * Importa ventas desde Excel a MySQL
 * @param {string} filePath - Ruta al archivo Excel
 * @param {boolean} reemplazar - Si true, reemplaza todos los datos. Si false, solo agrega
 * @returns {Promise<Object>} Resultado de la importación
 */
export async function importarVentasDesdeExcel(filePath, reemplazar = false) {
  try {
    console.log('\n🔄 Iniciando importación de ventas...');

    // 1. Procesar Excel
    const ventas = await procesarExcelVentas(filePath);

    if (ventas.length === 0) {
      return {
        success: false,
        message: 'No se encontraron ventas en el archivo',
        registros: 0
      };
    }

    // 2. Si reemplazar, truncar tabla
    if (reemplazar) {
      console.log('⚠️  Reemplazando todos los datos...');
      await Venta.truncate();
    }

    // 3. Insertar en la base de datos en batches (más eficiente)
    const BATCH_SIZE = 1000;
    let totalInsertados = 0;

    for (let i = 0; i < ventas.length; i += BATCH_SIZE) {
      const batch = ventas.slice(i, i + BATCH_SIZE);
      await Venta.insertBatch(batch);
      totalInsertados += batch.length;
      console.log(`   ⏳ Insertados ${totalInsertados}/${ventas.length}...`);
    }

    // 4. Verificar resultados
    const rangoFechas = await Venta.getRangoFechas();

    console.log('\n✅ Importación completada:');
    console.log(`   📊 Registros insertados: ${totalInsertados}`);
    console.log(`   📅 Rango de fechas: ${rangoFechas.min_fecha} a ${rangoFechas.max_fecha}`);
    console.log(`   📆 Días con ventas: ${rangoFechas.dias}\n`);

    return {
      success: true,
      message: 'Ventas importadas correctamente',
      registros: totalInsertados,
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
  importarVentasDesdeExcel,
  procesarExcelVentas
};
