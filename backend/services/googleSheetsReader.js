import axios from 'axios';
import { parse } from 'csv-parse/sync';
import { cache, cacheKeys } from '../config/database.js';

/**
 * Convierte una URL de Google Sheets en una URL de exportación CSV
 * @param {string} sheetUrl - URL del Google Sheet
 * @returns {string} - URL de exportación CSV
 */
function getCSVExportUrl(sheetUrl) {
  try {
    // Extraer el ID del spreadsheet de la URL
    const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      throw new Error('URL de Google Sheets inválida');
    }

    const spreadsheetId = match[1];

    // Extraer el GID (ID de la hoja) si existe
    const gidMatch = sheetUrl.match(/[#&]gid=([0-9]+)/);
    const gid = gidMatch ? gidMatch[1] : '0';

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

export default {
  readGoogleSheet,
  loadRutasVendedoresFromGoogleSheets,
  refreshRutasCache,
  getCSVExportUrl
};
