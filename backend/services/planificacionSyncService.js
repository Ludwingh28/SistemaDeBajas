import PlanificacionRuta from '../models/PlanificacionRuta.js';
import SyncLog from '../models/SyncLog.js';
import { readGoogleSheet } from './googleSheetsReader.js';
import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Lee los datos de planificación desde Google Sheets o CSV local
 */
async function leerDatosPlanificacion() {
  try {
    const googleSheetUrl = process.env.GOOGLE_SHEET_URL;

    // Intentar leer desde Google Sheets
    if (googleSheetUrl && googleSheetUrl.trim() !== '') {
      try {
        console.log('📊 Intentando leer desde Google Sheets...');
        const data = await readGoogleSheet(googleSheetUrl);
        console.log(`✓ Datos leídos desde Google Sheets: ${data.length} registros`);
        return data;
      } catch (error) {
        console.warn('⚠️  No se pudo acceder a Google Sheets, usando CSV local de respaldo');
      }
    }

    // Fallback: leer desde CSV local
    const csvPath = path.join(__dirname, '../reportes/PLANIFICACION - FINAL PLANIFICACION-DB.csv');
    if (!fs.existsSync(csvPath)) {
      throw new Error('No se encontró el archivo CSV de planificación');
    }

    console.log('📄 Leyendo desde CSV local...');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const data = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true
    });

    console.log(`✓ Datos leídos desde CSV local: ${data.length} registros`);
    return data;
  } catch (error) {
    console.error('Error leyendo datos de planificación:', error);
    throw error;
  }
}

/**
 * Normaliza un registro de planificación
 */
function normalizarRegistro(registro) {
  return {
    ruta: (registro.RUTA || registro.ruta || '').trim(),
    zona: (registro.ZONA || registro.zona || '').trim(),
    dia: (registro.DIA || registro.dia || '').trim(),
    vendedor: (registro.VENDEDOR || registro.vendedor || '').trim()
  };
}

/**
 * Compara si dos registros son diferentes
 */
function sonDiferentes(registroDB, registroSheet) {
  return (
    registroDB.zona !== registroSheet.zona ||
    registroDB.dia !== registroSheet.dia ||
    registroDB.vendedor !== registroSheet.vendedor
  );
}

/**
 * Migración inicial: Carga todos los datos desde el sheet a la base de datos
 * SOLO SE EJECUTA UNA VEZ
 */
export async function migrarDatosIniciales() {
  console.log('\n🚀 ========== MIGRACIÓN INICIAL DE PLANIFICACIÓN ==========\n');

  try {
    // Verificar si ya hay datos en la base de datos
    const totalExistente = await PlanificacionRuta.count();
    if (totalExistente > 0) {
      console.log(`⚠️  Ya existen ${totalExistente} registros en la base de datos`);
      console.log('⚠️  La migración inicial solo debe ejecutarse una vez');
      console.log('⚠️  Si deseas rehacer la migración, primero limpia la tabla manualmente\n');
      return {
        success: false,
        message: 'Ya existen datos en la base de datos'
      };
    }

    // Leer datos del sheet
    const datosSheet = await leerDatosPlanificacion();
    console.log(`📊 Total de registros a migrar: ${datosSheet.length}\n`);

    // Normalizar datos
    const datosNormalizados = datosSheet.map(normalizarRegistro);

    // Insertar en lote
    console.log('💾 Insertando registros en la base de datos...');
    const insertados = await PlanificacionRuta.insertBatch(datosNormalizados);

    // Registrar en el log
    await SyncLog.create('INITIAL', insertados, 0, 0, 'SUCCESS', 'Migración inicial completada');

    console.log(`\n✅ ========== MIGRACIÓN COMPLETADA ==========`);
    console.log(`✅ Registros insertados: ${insertados}`);
    console.log(`✅ Fecha: ${new Date().toLocaleString('es-BO')}\n`);

    return {
      success: true,
      insertados,
      message: 'Migración inicial completada exitosamente'
    };
  } catch (error) {
    console.error('\n❌ Error en migración inicial:', error.message);
    await SyncLog.create('INITIAL', 0, 0, 0, 'ERROR', error.message);

    throw error;
  }
}

/**
 * Sincronización automática: Compara el sheet con la DB y actualiza diferencias
 * SE EJECUTA A LAS 6 AM Y 7 PM TODOS LOS DÍAS
 */
export async function sincronizarPlanificacion() {
  console.log('\n🔄 ========== SINCRONIZACIÓN AUTOMÁTICA ==========');
  console.log(`🕐 Hora: ${new Date().toLocaleString('es-BO')}\n`);

  let insertados = 0;
  let actualizados = 0;
  let sinCambios = 0;

  try {
    // Leer datos del sheet
    console.log('📊 Leyendo datos del Google Sheet...');
    const datosSheet = await leerDatosPlanificacion();
    console.log(`   ✓ ${datosSheet.length} registros en el sheet\n`);

    // Obtener datos actuales de la DB
    console.log('💾 Consultando base de datos...');
    const datosDB = await PlanificacionRuta.getAll();
    console.log(`   ✓ ${datosDB.length} registros en la DB\n`);

    // Crear mapa de rutas existentes en DB
    const mapaDB = new Map();
    datosDB.forEach(ruta => {
      mapaDB.set(ruta.ruta, ruta);
    });

    console.log('🔍 Comparando datos...');

    // Procesar cada registro del sheet
    for (const registroSheet of datosSheet) {
      const normalizado = normalizarRegistro(registroSheet);

      // Validar que tenga al menos ruta
      if (!normalizado.ruta) {
        continue;
      }

      const rutaExistente = mapaDB.get(normalizado.ruta);

      if (!rutaExistente) {
        // Nuevo registro → INSERT
        await PlanificacionRuta.create(
          normalizado.ruta,
          normalizado.zona,
          normalizado.dia,
          normalizado.vendedor
        );
        insertados++;
        console.log(`   ➕ INSERT: ${normalizado.ruta}`);
      } else if (sonDiferentes(rutaExistente, normalizado)) {
        // Registro modificado → UPDATE
        await PlanificacionRuta.update(
          normalizado.ruta,
          normalizado.zona,
          normalizado.dia,
          normalizado.vendedor
        );
        actualizados++;
        console.log(`   ✏️  UPDATE: ${normalizado.ruta}`);
      } else {
        // Sin cambios
        sinCambios++;
      }
    }

    // Registrar en el log
    await SyncLog.create('UPDATE', insertados, actualizados, sinCambios, 'SUCCESS', null);

    console.log(`\n✅ ========== SINCRONIZACIÓN COMPLETADA ==========`);
    console.log(`✅ Registros insertados: ${insertados}`);
    console.log(`✅ Registros actualizados: ${actualizados}`);
    console.log(`✅ Sin cambios: ${sinCambios}`);
    console.log(`✅ Fecha: ${new Date().toLocaleString('es-BO')}\n`);

    return {
      success: true,
      insertados,
      actualizados,
      sinCambios,
      message: 'Sincronización completada exitosamente'
    };
  } catch (error) {
    console.error('\n❌ Error en sincronización:', error.message);
    await SyncLog.create('UPDATE', insertados, actualizados, sinCambios, 'ERROR', error.message);

    throw error;
  }
}

/**
 * Obtener estadísticas de sincronización
 */
export async function obtenerEstadisticasSync() {
  try {
    const statsRutas = await PlanificacionRuta.getStats();
    const statsSync = await SyncLog.getStats();

    return {
      ...statsRutas,
      ...statsSync
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    throw error;
  }
}

export default {
  migrarDatosIniciales,
  sincronizarPlanificacion,
  obtenerEstadisticasSync,
  leerDatosPlanificacion
};
