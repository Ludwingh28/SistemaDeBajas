import axios from 'axios';
import { parse } from 'csv-parse/sync';
import { cache, cacheKeys } from '../config/database.js';

/**
 * Convierte una URL de Google Sheets en una URL de exportación CSV
 * Soporta dos tipos de URL:
 * 1. URL normal con gid: https://docs.google.com/spreadsheets/d/ID/edit#gid=123
 * 2. URL de "Publicar en la web" como CSV: https://docs.google.com/spreadsheets/d/e/2PACX.../pub?output=csv
 *
 * @param {string} sheetUrl - URL del Google Sheet
 * @returns {string} - URL de exportación CSV
 */
function getCSVExportUrl(sheetUrl) {
  try {
    // Si la URL ya es de "Publicar en la web" como CSV, usarla directamente
    if (sheetUrl.includes('/pub') || sheetUrl.includes('output=csv')) {
      console.log('   → Detectada URL de "Publicar en la web" (pub), usando directamente');
      // Asegurarse que tenga output=csv
      if (!sheetUrl.includes('output=csv')) {
        // Agregar output=csv si no lo tiene
        const separator = sheetUrl.includes('?') ? '&' : '?';
        return `${sheetUrl}${separator}output=csv`;
      }
      return sheetUrl;
    }

    // Si es URL normal con /edit, extraer el ID y gid
    const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      throw new Error('URL de Google Sheets inválida');
    }

    const spreadsheetId = match[1];

    // Extraer el GID (ID de la hoja) si existe
    const gidMatch = sheetUrl.match(/[#&]gid=([0-9]+)/);
    const gid = gidMatch ? gidMatch[1] : '0';

    console.log(`   → Convertida URL normal a CSV (gid=${gid})`);

    // Construir URL de exportación CSV
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
  } catch (error) {
    console.error('Error procesando URL de Google Sheets:', error);
    throw error;
  }
}

/**
 * Lee datos de un Google Sheet público y los parsea
 * @param {string} sheetUrl - URL del Google Sheet público
 * @returns {Promise<Array>} - Array de objetos con los datos
 */
export async function readGoogleSheet(sheetUrl) {
  try {
    if (!sheetUrl || sheetUrl.trim() === '') {
      throw new Error('URL de Google Sheets no configurada');
    }

    console.log('📊 Leyendo Google Sheet...');

    // Convertir a URL de exportación CSV
    const csvUrl = getCSVExportUrl(sheetUrl);

    // Descargar CSV
    const response = await axios.get(csvUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SistemaBajas/1.0)'
      }
    });

    if (response.status !== 200) {
      throw new Error(`Error descargando Google Sheet: ${response.status}`);
    }

    const csvData = response.data;

    // Parsear CSV
    const records = parse(csvData, {
      columns: true, // Primera fila como nombres de columnas
      skip_empty_lines: true,
      trim: true,
      bom: true // Manejar BOM (Byte Order Mark)
    });

    console.log(`✓ Google Sheet leído: ${records.length} filas`);
    return records;
  } catch (error) {
    console.error('Error leyendo Google Sheet:', error.message);
    throw error;
  }
}

/**
 * Lee y cachea los datos de rutas vendedores desde Google Sheets
 * @param {string} sheetUrl - URL del Google Sheet
 * @returns {Promise<Array>} - Datos de rutas vendedores
 */
export async function loadRutasVendedoresFromGoogleSheets(sheetUrl) {
  try {
    const data = await readGoogleSheet(sheetUrl);

    // Normalizar nombres de columnas (en caso de que tengan espacios o mayúsculas)
    const normalizedData = data.map(row => {
      const normalized = {};
      Object.keys(row).forEach(key => {
        const normalizedKey = key.trim().toUpperCase();
        normalized[normalizedKey] = row[key];
      });
      return normalized;
    });

    // Cachear datos
    cache.set(cacheKeys.RUTAS, normalizedData);
    console.log('✓ Rutas vendedores cacheadas desde Google Sheets');

    return normalizedData;
  } catch (error) {
    console.error('Error cargando rutas desde Google Sheets:', error);
    throw error;
  }
}

/**
 * Función para refrescar el caché de rutas vendedores
 */
export async function refreshRutasCache() {
  try {
    const googleSheetUrl = process.env.GOOGLE_SHEET_URL;

    if (!googleSheetUrl || googleSheetUrl.trim() === '') {
      console.warn('⚠️  GOOGLE_SHEET_URL no configurada, usando Excel local');
      return false;
    }

    await loadRutasVendedoresFromGoogleSheets(googleSheetUrl);
    return true;
  } catch (error) {
    console.error('Error refrescando caché de rutas:', error);
    return false;
  }
}

/**
 * Lee los datos de las 3 hojas regionales de planificación
 * @returns {Promise<Array>} - Datos combinados de las 3 regionales
 */
export async function readMultipleGoogleSheets() {
  try {
    const sheetUrls = {
      santaCruz: process.env.GOOGLE_SHEET_SANTA_CRUZ,
      cochabamba: process.env.GOOGLE_SHEET_COCHABAMBA,
      laPaz: process.env.GOOGLE_SHEET_LA_PAZ
    };

    console.log('📊 Leyendo datos de las 3 regionales...');

    const allData = [];
    const errors = [];

    // Leer Hoja Santa Cruz
    if (sheetUrls.santaCruz && sheetUrls.santaCruz.trim() !== '') {
      try {
        console.log('  📄 Leyendo hoja Santa Cruz...');
        const dataSC = await readGoogleSheet(sheetUrls.santaCruz);
        console.log(`     ✓ ${dataSC.length} registros de Santa Cruz`);
        allData.push(...dataSC);
      } catch (error) {
        console.error('  ❌ Error leyendo hoja Santa Cruz:', error.message);
        errors.push({ regional: 'Santa Cruz', error: error.message });
      }
    } else {
      console.warn('  ⚠️  URL de Santa Cruz no configurada');
    }

    // Leer Hoja Cochabamba
    if (sheetUrls.cochabamba && sheetUrls.cochabamba.trim() !== '') {
      try {
        console.log('  📄 Leyendo hoja Cochabamba...');
        const dataCB = await readGoogleSheet(sheetUrls.cochabamba);
        console.log(`     ✓ ${dataCB.length} registros de Cochabamba`);
        allData.push(...dataCB);
      } catch (error) {
        console.error('  ❌ Error leyendo hoja Cochabamba:', error.message);
        errors.push({ regional: 'Cochabamba', error: error.message });
      }
    } else {
      console.warn('  ⚠️  URL de Cochabamba no configurada');
    }

    // Leer Hoja La Paz
    if (sheetUrls.laPaz && sheetUrls.laPaz.trim() !== '') {
      try {
        console.log('  📄 Leyendo hoja La Paz...');
        const dataLP = await readGoogleSheet(sheetUrls.laPaz);
        console.log(`     ✓ ${dataLP.length} registros de La Paz`);
        allData.push(...dataLP);
      } catch (error) {
        console.error('  ❌ Error leyendo hoja La Paz:', error.message);
        errors.push({ regional: 'La Paz', error: error.message });
      }
    } else {
      console.warn('  ⚠️  URL de La Paz no configurada');
    }

    if (allData.length === 0) {
      throw new Error('No se pudo leer ninguna hoja regional. Verifica las URLs configuradas.');
    }

    console.log(`✅ Total de registros combinados: ${allData.length}`);

    if (errors.length > 0) {
      console.warn(`⚠️  Se encontraron ${errors.length} error(es) al leer algunas hojas:`);
      errors.forEach(e => console.warn(`   - ${e.regional}: ${e.error}`));
    }

    return {
      data: allData,
      errors: errors,
      stats: {
        total: allData.length,
        errorsCount: errors.length
      }
    };
  } catch (error) {
    console.error('Error leyendo hojas regionales:', error.message);
    throw error;
  }
}

export default {
  readGoogleSheet,
  loadRutasVendedoresFromGoogleSheets,
  refreshRutasCache,
  getCSVExportUrl,
  readMultipleGoogleSheets
};
