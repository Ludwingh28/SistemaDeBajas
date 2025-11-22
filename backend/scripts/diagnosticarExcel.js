import ExcelJS from 'exceljs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

async function diagnosticarExcel() {
  const excelPath = join(__dirname, '..', 'data', process.env.EXCEL_VENTAS || 'ventas_nuevito.xlsx');

  console.log('\n🔍 ========== DIAGNÓSTICO DEL EXCEL ==========\n');
  console.log(`📁 Archivo: ${excelPath}\n`);

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(excelPath);

    console.log('📊 HOJAS EN EL EXCEL:');
    console.log('─'.repeat(60));
    workbook.eachSheet((worksheet, sheetId) => {
      console.log(`  ${sheetId}. "${worksheet.name}" (${worksheet.rowCount} filas)`);
    });

    // Diagnosticar VentasPOD
    console.log('\n📋 HOJA: VentasPOD');
    console.log('─'.repeat(60));
    const ventasSheet = workbook.getWorksheet('VentasPOD');

    if (!ventasSheet) {
      console.log('❌ No se encontró la hoja "VentasPOD"');
      console.log('💡 Verifica que la hoja se llame exactamente "VentasPOD" (case-sensitive)');
    } else {
      console.log(`✅ Hoja encontrada (${ventasSheet.rowCount} filas)`);

      // Mostrar primeras 10 filas
      console.log('\n🔎 Primeras 10 filas:');
      for (let i = 1; i <= Math.min(10, ventasSheet.rowCount); i++) {
        const row = ventasSheet.getRow(i);
        const values = row.values.slice(1).map(v => {
          if (v === null || v === undefined) return '[vacío]';
          if (typeof v === 'object' && v.result) return v.result;
          return String(v).substring(0, 30);
        });
        console.log(`  Fila ${i}: ${values.join(' | ')}`);
      }

      // Verificar fila 4 (headers esperados)
      console.log('\n📌 FILA 4 (Headers esperados):');
      const headerRow = ventasSheet.getRow(4);
      const headers = headerRow.values.slice(1);
      console.log(`  ${headers.join(' | ')}`);

      console.log('\n🎯 Buscando columnas requeridas:');
      console.log(`  - "Fecha": ${headers.includes('Fecha') ? '✅' : '❌ NO ENCONTRADA'}`);
      console.log(`  - "Cliente": ${headers.includes('Cliente') ? '✅' : '❌ NO ENCONTRADA'}`);
      console.log(`  - "Nombre Cliente": ${headers.includes('Nombre Cliente') ? '✅' : '❌ NO ENCONTRADA'}`);
    }

    // Diagnosticar clientes
    console.log('\n\n📋 HOJA: clientes');
    console.log('─'.repeat(60));
    const clientesSheet = workbook.getWorksheet('clientes');

    if (!clientesSheet) {
      console.log('❌ No se encontró la hoja "clientes"');
      console.log('💡 Verifica que la hoja se llame exactamente "clientes" (todo en minúsculas)');
    } else {
      console.log(`✅ Hoja encontrada (${clientesSheet.rowCount} filas)`);

      // Mostrar primeras 10 filas
      console.log('\n🔎 Primeras 10 filas:');
      for (let i = 1; i <= Math.min(10, clientesSheet.rowCount); i++) {
        const row = clientesSheet.getRow(i);
        const values = row.values.slice(1).map(v => {
          if (v === null || v === undefined) return '[vacío]';
          if (typeof v === 'object' && v.result) return v.result;
          return String(v).substring(0, 30);
        });
        console.log(`  Fila ${i}: ${values.join(' | ')}`);
      }

      // Verificar fila 5 (headers esperados)
      console.log('\n📌 FILA 5 (Headers esperados):');
      const headerRow = clientesSheet.getRow(5);
      const headers = headerRow.values.slice(1);
      console.log(`  ${headers.join(' | ')}`);

      console.log('\n🎯 Buscando columnas requeridas:');
      console.log(`  - "CODIGO": ${headers.includes('CODIGO') ? '✅' : '❌ NO ENCONTRADA'}`);
      console.log(`  - "NOMBRE": ${headers.includes('NOMBRE') ? '✅' : '❌ NO ENCONTRADA'}`);
      console.log(`  - "RUTA": ${headers.includes('RUTA') ? '✅' : '❌ NO ENCONTRADA'}`);
      console.log(`  - "ZONA": ${headers.includes('ZONA') ? '✅' : '❌ NO ENCONTRADA'}`);
      console.log(`  - "ACTIVO": ${headers.includes('ACTIVO') ? '✅' : '❌ NO ENCONTRADA'}`);
    }

    console.log('\n' + '='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

diagnosticarExcel();
