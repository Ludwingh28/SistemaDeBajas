import Ruta from '../models/Ruta.js';
import Zona from '../models/Zona.js';
import Vendedor from '../models/Vendedor.js';
import Dia from '../models/Dia.js';
import SyncLog from '../models/SyncLog.js';
import { readGoogleSheet, readMultipleGoogleSheets } from './googleSheetsReader.js';
import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Lee los datos de planificación desde Google Sheets (3 hojas regionales) o CSV local
 */
async function leerDatosPlanificacion() {
  try {
    // Verificar si hay URLs configuradas para las hojas regionales
    const sheetUrls = {
      santaCruz: process.env.GOOGLE_SHEET_SANTA_CRUZ,
      cochabamba: process.env.GOOGLE_SHEET_COCHABAMBA,
      laPaz: process.env.GOOGLE_SHEET_LA_PAZ
    };

    const hayUrlsConfiguradas = Object.values(sheetUrls).some(url => url && url.trim() !== '');

    // Intentar leer desde Google Sheets (3 hojas regionales)
    if (hayUrlsConfiguradas) {
      try {
        console.log('📊 Intentando leer desde Google Sheets (3 regionales)...');
        const result = await readMultipleGoogleSheets();
        console.log(`✓ Datos leídos desde Google Sheets: ${result.data.length} registros`);

        if (result.errors.length > 0) {
          console.warn(`⚠️  Advertencia: ${result.errors.length} hoja(s) no pudieron ser leídas`);
        }

        return result.data;
      } catch (error) {
        console.warn('⚠️  No se pudo acceder a Google Sheets, usando CSV local de respaldo');
        console.warn('   Error:', error.message);
      }
    } else {
      console.warn('⚠️  No hay URLs de Google Sheets configuradas, usando CSV local');
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
 * Agrupa registros por ruta para manejar rutas con múltiples días
 * Retorna un Map donde la clave es el código de ruta y el valor es un objeto con los días
 */
function agruparPorRuta(registros) {
  const rutasMap = new Map();

  for (const registro of registros) {
    const normalizado = normalizarRegistro(registro);

    // Validar que tenga ruta
    if (!normalizado.ruta) {
      continue;
    }

    if (!rutasMap.has(normalizado.ruta)) {
      // Primera vez que vemos esta ruta
      rutasMap.set(normalizado.ruta, {
        codigo: normalizado.ruta,
        zona: normalizado.zona,
        vendedor: normalizado.vendedor,
        dias: new Set([normalizado.dia])
      });
    } else {
      // La ruta ya existe, agregar el día
      const rutaExistente = rutasMap.get(normalizado.ruta);
      rutaExistente.dias.add(normalizado.dia);
    }
  }

  return rutasMap;
}

/**
 * Migración inicial: Carga todos los datos desde el sheet a la base de datos
 * SOLO SE EJECUTA UNA VEZ
 */
export async function migrarDatosIniciales() {
  console.log('\n🚀 ========== MIGRACIÓN INICIAL DE PLANIFICACIÓN ==========\n');

  try {
    // Verificar si ya hay datos en la base de datos
    const totalExistente = await Ruta.count();
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
    console.log(`📊 Total de registros leídos: ${datosSheet.length}\n`);

    // Agrupar por ruta para eliminar duplicados y consolidar días
    const rutasAgrupadas = agruparPorRuta(datosSheet);
    console.log(`📊 Total de rutas únicas: ${rutasAgrupadas.size}\n`);

    let insertados = 0;
    let errores = 0;

    console.log('💾 Procesando rutas...');

    for (const [codigoRuta, datosRuta] of rutasAgrupadas) {
      try {
        // 1. Obtener o crear la zona
        const zona = await Zona.getOrCreate(datosRuta.zona, datosRuta.zona);

        // 2. Obtener o crear el vendedor (si existe)
        let vendedor = null;
        if (datosRuta.vendedor && datosRuta.vendedor.trim() !== '') {
          vendedor = await Vendedor.getOrCreate(datosRuta.vendedor);
        }

        // 3. Crear la ruta
        const ruta = await Ruta.create(
          datosRuta.codigo,
          zona.id,
          vendedor ? vendedor.id : null
        );

        // 4. Agregar los días a la ruta
        for (const codigoDia of datosRuta.dias) {
          if (codigoDia && codigoDia.trim() !== '') {
            const dia = await Dia.getByCodigo(codigoDia);
            if (dia) {
              await Ruta.addDia(ruta.id, dia.id);
            } else {
              console.warn(`   ⚠️  Día no encontrado: ${codigoDia} para ruta ${codigoRuta}`);
            }
          }
        }

        insertados++;

        if (insertados % 50 === 0) {
          console.log(`   ✓ Procesadas ${insertados} rutas...`);
        }
      } catch (error) {
        errores++;
        console.error(`   ❌ Error procesando ruta ${codigoRuta}:`, error.message);
      }
    }

    // Registrar en el log
    await SyncLog.create('INITIAL', insertados, 0, 0, 'SUCCESS', `Migración completada. Errores: ${errores}`);

    console.log(`\n✅ ========== MIGRACIÓN COMPLETADA ==========`);
    console.log(`✅ Rutas insertadas: ${insertados}`);
    console.log(`✅ Errores: ${errores}`);
    console.log(`✅ Fecha: ${new Date().toLocaleString('es-BO')}\n`);

    return {
      success: true,
      insertados,
      errores,
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
  let errores = 0;

  try {
    // Leer datos del sheet
    console.log('📊 Leyendo datos del Google Sheet...');
    const datosSheet = await leerDatosPlanificacion();
    console.log(`   ✓ ${datosSheet.length} registros en el sheet\n`);

    // Agrupar por ruta
    const rutasAgrupadas = agruparPorRuta(datosSheet);
    console.log(`   ✓ ${rutasAgrupadas.size} rutas únicas\n`);

    // Obtener datos actuales de la DB
    console.log('💾 Consultando base de datos...');
    const rutasDB = await Ruta.getAll();
    console.log(`   ✓ ${rutasDB.length} rutas en la DB\n`);

    // Crear mapa de rutas existentes en DB
    const mapaDB = new Map();
    rutasDB.forEach(ruta => {
      mapaDB.set(ruta.codigo, {
        id: ruta.id,
        zona_codigo: ruta.zona_codigo,
        vendedor_nombre: ruta.vendedor_nombre || '',
        dias_codigos: ruta.dias_codigos || '',
        zona_id: ruta.zona_id,
        vendedor_id: ruta.vendedor_id
      });
    });

    console.log('🔍 Comparando datos...');

    // Procesar cada ruta del sheet
    for (const [codigoRuta, datosRuta] of rutasAgrupadas) {
      try {
        const rutaExistente = mapaDB.get(codigoRuta);

        if (!rutaExistente) {
          // Nueva ruta → INSERT
          const zona = await Zona.getOrCreate(datosRuta.zona, datosRuta.zona);
          let vendedor = null;
          if (datosRuta.vendedor && datosRuta.vendedor.trim() !== '') {
            vendedor = await Vendedor.getOrCreate(datosRuta.vendedor);
          }

          const ruta = await Ruta.create(
            datosRuta.codigo,
            zona.id,
            vendedor ? vendedor.id : null
          );

          // Agregar días
          for (const codigoDia of datosRuta.dias) {
            if (codigoDia && codigoDia.trim() !== '') {
              const dia = await Dia.getByCodigo(codigoDia);
              if (dia) {
                await Ruta.addDia(ruta.id, dia.id);
              }
            }
          }

          insertados++;
          console.log(`   ➕ INSERT: ${codigoRuta}`);
        } else {
          // Verificar si hay cambios
          const diasActualesSet = new Set(rutaExistente.dias_codigos.split(', ').filter(d => d));
          const diasNuevosSet = datosRuta.dias;

          const cambioZona = rutaExistente.zona_codigo !== datosRuta.zona;
          const cambioVendedor = (rutaExistente.vendedor_nombre || '') !== (datosRuta.vendedor || '');
          const cambioDias = diasActualesSet.size !== diasNuevosSet.size ||
            ![...diasActualesSet].every(d => diasNuevosSet.has(d));

          if (cambioZona || cambioVendedor || cambioDias) {
            // Actualizar zona si cambió
            let zonaId = rutaExistente.zona_id;
            if (cambioZona) {
              const zona = await Zona.getOrCreate(datosRuta.zona, datosRuta.zona);
              zonaId = zona.id;
            }

            // Actualizar vendedor si cambió
            let vendedorId = rutaExistente.vendedor_id;
            if (cambioVendedor) {
              if (datosRuta.vendedor && datosRuta.vendedor.trim() !== '') {
                const vendedor = await Vendedor.getOrCreate(datosRuta.vendedor);
                vendedorId = vendedor.id;
              } else {
                vendedorId = null;
              }
            }

            // Actualizar ruta
            await Ruta.update(rutaExistente.id, zonaId, vendedorId);

            // Actualizar días si cambiaron
            if (cambioDias) {
              const diasIds = [];
              for (const codigoDia of datosRuta.dias) {
                if (codigoDia && codigoDia.trim() !== '') {
                  const dia = await Dia.getByCodigo(codigoDia);
                  if (dia) {
                    diasIds.push(dia.id);
                  }
                }
              }
              await Ruta.setDias(rutaExistente.id, diasIds);
            }

            actualizados++;
            console.log(`   ✏️  UPDATE: ${codigoRuta}`);
          } else {
            sinCambios++;
          }
        }
      } catch (error) {
        errores++;
        console.error(`   ❌ Error procesando ruta ${codigoRuta}:`, error.message);
      }
    }

    // Registrar en el log
    await SyncLog.create(
      'UPDATE',
      insertados,
      actualizados,
      sinCambios,
      errores > 0 ? 'WARNING' : 'SUCCESS',
      errores > 0 ? `Completado con ${errores} errores` : null
    );

    console.log(`\n✅ ========== SINCRONIZACIÓN COMPLETADA ==========`);
    console.log(`✅ Registros insertados: ${insertados}`);
    console.log(`✅ Registros actualizados: ${actualizados}`);
    console.log(`✅ Sin cambios: ${sinCambios}`);
    console.log(`✅ Errores: ${errores}`);
    console.log(`✅ Fecha: ${new Date().toLocaleString('es-BO')}\n`);

    return {
      success: true,
      insertados,
      actualizados,
      sinCambios,
      errores,
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
    const statsRutas = await Ruta.getStats();
    const statsSync = await SyncLog.getStats();
    const zonas = await Zona.getAll();
    const vendedores = await Vendedor.count();

    return {
      ...statsRutas,
      ...statsSync,
      totalZonas: zonas.length,
      totalVendedores: vendedores,
      zonas: zonas.map(z => ({ codigo: z.codigo, nombre: z.nombre }))
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
