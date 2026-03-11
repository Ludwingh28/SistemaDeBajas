import ExcelJS from 'exceljs';
import Venta from '../models/Venta.js';

/**
 * Detecta automáticamente la hoja y fila de headers
 * Busca las columnas: "Fecha", "Cliente", "Nombre Cliente"
 * @param {string} filePath - Ruta al archivo Excel
 * @returns {Promise<{sheetName: string, headerRow: number}>}
 */
async function detectarEstructuraExcel(filePath) {
  const XLSX = await import('xlsx');
  const fs = await import('fs');

  const buffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(buffer, { type: 'buffer' });

  // Intentar detectar en cada hoja
  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    // Buscar fila con headers
    for (let rowIdx = 0; rowIdx < Math.min(data.length, 20); rowIdx++) {
      const row = data[rowIdx];
      const rowStr = row.map(c => String(c || '').toLowerCase());

      // Verificar si tiene las columnas clave
      const tieneFecha = rowStr.some(v => v.includes('fecha'));
      const tieneCliente = rowStr.some(v => v.includes('cliente'));
      const tieneNombre = rowStr.some(v => v.includes('nombre'));

      if (tieneFecha && tieneCliente && tieneNombre) {
        console.log(`✓ Detectada estructura en hoja "${sheetName}", fila ${rowIdx + 1}`);
        return { sheetName, headerRow: rowIdx + 1 };
      }
    }
  }

  // Si no detecta, usar valores por defecto
  console.warn('⚠️  No se detectó estructura automáticamente. Usando hoja "VentasPOD", fila 4');
  return { sheetName: 'VentasPOD', headerRow: 4 };
}

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
      let headersDetected = false;

      for await (const row of worksheetReader) {
        rowNumber++;

        // Detectar headers dinámicamente
        if (!headersDetected) {
          const possibleHeaders = row.values.map(h => h?.toString().toLowerCase().trim() || '');

          // Verificar si esta fila contiene los headers clave
          if (possibleHeaders.some(h => h.includes('fecha')) &&
              possibleHeaders.some(h => h.includes('cliente'))) {
            headers = row.values.map(h => h?.toString().trim() || '');
            headersDetected = true;
            console.log(`   ✓ Headers encontrados en fila ${rowNumber}`);
            console.log(`   📋 Columnas detectadas:`, headers.slice(0, 10));
            continue;
          } else {
            // No es la fila de headers, seguir buscando
            continue;
          }
        }

        // Procesar datos (solo después de detectar headers)
        if (headersDetected && headers.length > 0) {
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

          // Debug para primera fila de datos
          if (totalProcesados === 0 && (fecha || codigoCliente)) {
            console.log(`   🔍 Primera fila de datos:`, {
              fecha: fecha,
              codigoCliente: codigoCliente,
              nombreCliente: nombreCliente,
              allKeys: Object.keys(rowData).slice(0, 10)
            });
          }

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
 * @param {string} originalName - Nombre original del archivo (opcional, para detectar tipo)
 * @returns {Promise<Object>} Resultado de la importación
 */
export async function importarVentasDesdeExcel(filePath, reemplazar = false, originalName = null) {
  try {
    console.log('\n🔄 Iniciando importación de ventas (modo streaming)...');

    // Detectar si es .xls por nombre original o ruta
    const nombreParaDeteccion = originalName || filePath;
    const esArchivoXLS = nombreParaDeteccion.toLowerCase().endsWith('.xls') &&
                         !nombreParaDeteccion.toLowerCase().endsWith('.xlsx');

    // Si es archivo .xls, convertir a .xlsx primero
    let processPath = filePath;
    if (esArchivoXLS) {
      console.log('📝 Detectado archivo .xls antiguo, convirtiendo a .xlsx...');
      const XLSX = await import('xlsx');
      const fs = await import('fs');

      // Leer .xls
      const buffer = fs.readFileSync(filePath);
      const workbook = XLSX.read(buffer, { type: 'buffer' });

      // Convertir a .xlsx
      const xlsxPath = filePath.replace(/\.xls$/i, '.xlsx');
      XLSX.writeFile(workbook, xlsxPath);
      processPath = xlsxPath;
      console.log(`✓ Convertido a: ${xlsxPath}`);
    }

    // Detectar automáticamente la estructura del Excel
    const { sheetName, headerRow } = await detectarEstructuraExcel(processPath);
    console.log(`📋 Usando hoja: "${sheetName}", headers en fila: ${headerRow}`);

    // Procesar con streaming (inserta directamente sin cargar todo en memoria)
    const resultado = await procesarExcelVentasStreaming(processPath, sheetName, headerRow, reemplazar);

    // Limpiar archivo temporal .xlsx si se convirtió
    if (processPath !== filePath) {
      try {
        const fs = await import('fs');
        fs.unlinkSync(processPath);
        console.log(`🗑️  Archivo temporal eliminado: ${processPath}`);
      } catch (e) {
        console.warn('No se pudo eliminar archivo temporal:', e.message);
      }
    }

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
