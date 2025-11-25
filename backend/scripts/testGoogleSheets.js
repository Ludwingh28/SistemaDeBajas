import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { readGoogleSheet } from '../services/googleSheetsReader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '../.env') });

async function testGoogleSheets() {
  console.log('\n🧪 ========== TEST DE GOOGLE SHEETS ==========\n');

  try {
    const googleSheetUrl = process.env.GOOGLE_SHEET_URL;

    if (!googleSheetUrl || googleSheetUrl.trim() === '') {
      console.error('❌ GOOGLE_SHEET_URL no está configurada en .env');
      process.exit(1);
    }

    console.log('📋 URL configurada:', googleSheetUrl);
    console.log('');

    console.log('📊 Intentando leer Google Sheet...');
    const data = await readGoogleSheet(googleSheetUrl);

    console.log('');
    console.log('✅ ========== LECTURA EXITOSA ==========');
    console.log(`✅ Total de registros: ${data.length}`);
    console.log('');

    if (data.length > 0) {
      console.log('📋 Primeros 3 registros:');
      console.log('');
      data.slice(0, 3).forEach((row, index) => {
        console.log(`Registro ${index + 1}:`);
        console.log(JSON.stringify(row, null, 2));
        console.log('');
      });

      console.log('🔑 Columnas detectadas:');
      const columns = Object.keys(data[0]);
      columns.forEach(col => console.log(`   - ${col}`));
      console.log('');
    }

    console.log('✅ Test completado exitosamente');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error en el test:', error.message);
    console.error('\nDetalles:', error);
    console.log('');
    console.log('💡 Posibles soluciones:');
    console.log('   1. Asegúrate de que el Google Sheet sea público o esté compartido');
    console.log('   2. Ve a: Archivo → Compartir → Cualquier persona con el enlace');
    console.log('   3. Selecciona: "Cualquier persona con el enlace" como "Lector"');
    console.log('');
    process.exit(1);
  }
}

// Ejecutar test
testGoogleSheets();
