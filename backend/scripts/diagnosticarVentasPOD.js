import ExcelJS from 'exceljs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

async function diagnosticarVentasPOD() {
  const excelPath = join(__dirname, '..', 'data', process.env.EXCEL_VENTAS || 'ventas_nuevito.xlsx');

  console.log('\n🔍 ========== DIAGNÓSTICO VENTASPOD ==========\n');
  console.log(`📁 Archivo: ${excelPath}\n`);

  try {
    const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader(excelPath, {
      sharedStrings: 'cache',
      hyperlinks: 'ignore',
      worksheets: 'emit'
    });

    for await (const worksheetReader of workbookReader) {
      if (worksheetReader.name !== 'VentasPOD') {
        continue;
      }

      console.log('✅ Hoja "VentasPOD" encontrada\n');

      let rowNumber = 0;
      let headers = [];

      for await (const row of worksheetReader) {
        rowNumber++;

        // Mostrar primeras 10 filas
        if (rowNumber <= 10) {
          const values = row.values.slice(1).map(v => {
            if (v === null || v === undefined) return '[vacío]';
            if (typeof v === 'object' && v.result) return v.result;
            return String(v).substring(0, 40);
          });
          console.log(`Fila ${rowNumber}: ${values.join(' | ')}`);
        }

        // Capturar headers de fila 4
        if (rowNumber === 4) {
          headers = row.values.slice(1);
          console.log('\n📌 HEADERS EN FILA 4:');
          console.log('─'.repeat(80));
          headers.forEach((h, i) => {
            const headerStr = h ? String(h) : '[vacío]';
            console.log(`  Columna ${i + 1}: "${headerStr}" (length: ${headerStr.length})`);
          });

          console.log('\n🎯 VERIFICACIÓN DE COLUMNAS REQUERIDAS:');
          console.log('─'.repeat(80));

          const tieneFecha = headers.some(h => String(h).trim() === 'Fecha');
          const tieneCliente = headers.some(h => String(h).trim() === 'Cliente');
          const tieneNombreCliente = headers.some(h => String(h).trim() === 'Nombre Cliente');

          console.log(`  ✓ Busco: "Fecha" → ${tieneFecha ? '✅ ENCONTRADO' : '❌ NO ENCONTRADO'}`);
          console.log(`  ✓ Busco: "Cliente" → ${tieneCliente ? '✅ ENCONTRADO' : '❌ NO ENCONTRADO'}`);
          console.log(`  ✓ Busco: "Nombre Cliente" → ${tieneNombreCliente ? '✅ ENCONTRADO' : '❌ NO ENCONTRADO'}`);

          console.log('\n💡 COLUMNAS SIMILARES ENCONTRADAS:');
          console.log('─'.repeat(80));
          headers.forEach(h => {
            const headerLower = String(h || '').toLowerCase();
            if (headerLower.includes('fecha') || headerLower.includes('date')) {
              console.log(`  → "${h}" (contiene "fecha")`);
            }
            if (headerLower.includes('cliente') || headerLower.includes('client')) {
              console.log(`  → "${h}" (contiene "cliente")`);
            }
            if (headerLower.includes('nombre')) {
              console.log(`  → "${h}" (contiene "nombre")`);
            }
          });
        }

        // Mostrar primeras 3 filas de datos
        if (rowNumber > 4 && rowNumber <= 7) {
          console.log(`\nFila ${rowNumber} (datos):`, row.values.slice(1, 10));
        }

        // Solo procesar las primeras 10 filas para el diagnóstico
        if (rowNumber >= 10) {
          break;
        }
      }

      console.log('\n' + '='.repeat(80) + '\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

diagnosticarVentasPOD();
