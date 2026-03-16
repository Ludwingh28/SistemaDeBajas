import { Builder, By, until } from 'selenium-webdriver';
import edge from 'selenium-webdriver/edge.js';
import { query } from '../config/mysql.js';
import {
  ZONAS_DUALPOINT,
  SELECTORES,
  obtenerRutaGenerica
} from '../config/dualpoint.js';

const TIMEOUT_PAGE_LOAD = 60000; // 60 segundos (aumentado para páginas lentas)
const TIMEOUT_ELEMENT = 30000; // 30 segundos (aumentado para elementos lentos)
const TIMEOUT_GLOBAL = 15 * 60 * 1000; // 15 minutos

/**
 * Servicio para inhabilitar clientes cambiándolos a rutas genéricas en Dualpoint
 */

/**
 * Obtiene clientes aprobados pendientes de inhabilitación
 * @returns {Promise<Array>} Lista de clientes a inhabilitar
 */
async function obtenerClientesParaInhabilitar() {
  try {
    console.log('[INHABILITACION] Buscando clientes aprobados para inhabilitar...');

    const clientes = await query(`
      SELECT
        id,
        codigo_cliente as codigoCliente,
        nombre_cliente as nombreCliente,
        zona,
        ruta,
        vendedor,
        motivo,
        estado_aprobacion as estadoAprobacion,
        fecha_aprobacion as fechaAprobacion,
        inhabilitado_dualpoint as inhabilitado
      FROM reportes
      WHERE estado_aprobacion = 'APROBADO'
        AND (inhabilitado_dualpoint IS NULL OR inhabilitado_dualpoint = 0)
      ORDER BY zona, fecha_aprobacion ASC
    `);

    console.log(`[OK] ${clientes.length} clientes encontrados para inhabilitar`);
    return clientes;
  } catch (error) {
    console.error('[ERROR] Error obteniendo clientes para inhabilitar:', error.message);
    throw error;
  }
}

/**
 * Agrupa clientes por Dualpoint
 * @param {Array} clientes - Lista de clientes
 * @returns {Object} Clientes agrupados por dualpoint y omitidos
 */
function agruparClientesPorDualpoint(clientes) {
  const grupos = {
    'Santa Cruz': [],
    'Cochabamba': [],
    'La Paz': []
  };

  const omitidos = [];

  for (const cliente of clientes) {
    const rutaInfo = obtenerRutaGenerica(cliente.zona);

    if (!rutaInfo) {
      const razon = !cliente.zona || cliente.zona === 'null'
        ? 'Zona no especificada en la solicitud'
        : 'Cliente tipo LICORES (excluido del sistema)';

      console.warn(`[WARN] Cliente ${cliente.codigoCliente} - ${cliente.nombreCliente} OMITIDO: ${razon}`);

      omitidos.push({
        id: cliente.id,
        codigoCliente: cliente.codigoCliente,
        nombreCliente: cliente.nombreCliente,
        zona: cliente.zona || 'NO ESPECIFICADA',
        razon: razon
      });
      continue;
    }

    grupos[rutaInfo.dualpoint].push({
      ...cliente,
      rutaGenerica: rutaInfo.rutaGenerica,
      dualpoint: rutaInfo.dualpoint
    });
  }

  return { grupos, omitidos };
}

/**
 * Inhabilita un cliente en Dualpoint cambiando su ruta a ruta genérica
 * @param {object} driver - Selenium driver
 * @param {object} cliente - Datos del cliente
 * @param {string} cambioRutaUrl - URL de cambio de ruta
 */
async function inhabilitarClienteEnDualpoint(driver, cliente, cambioRutaUrl) {
  try {
    console.log(`   [>] Inhabilitando ${cliente.codigoCliente} - ${cliente.nombreCliente}`);

    // Navegar a página de cambio de ruta
    await driver.get(cambioRutaUrl);

    // Esperar a que la página cargue completamente
    await driver.wait(
      async (driver) => {
        const readyState = await driver.executeScript('return document.readyState');
        return readyState === 'complete';
      },
      TIMEOUT_ELEMENT
    );

    // PASO 1: Ingresar código de cliente usando SOLO JavaScript
    console.log(`      -> Ingresando código: ${cliente.codigoCliente}`);

    // Esperar a que haya al menos un input de texto
    await driver.wait(
      async (driver) => {
        const count = await driver.executeScript(`
          return document.querySelectorAll('input[type="text"]').length;
        `);
        return count > 0;
      },
      TIMEOUT_ELEMENT
    );

    // Ingresar el código usando JavaScript puro
    const inputSuccess = await driver.executeScript(`
      const inputs = document.querySelectorAll('input[type="text"]');
      if (inputs.length === 0) return false;

      const input = inputs[0];
      input.value = arguments[0];
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    `, cliente.codigoCliente);

    if (!inputSuccess) {
      throw new Error('No se encontró input de código de cliente');
    }

    // PASO 2: Click en botón buscar usando JavaScript
    console.log(`      -> Buscando cliente...`);

    const buscarSuccess = await driver.executeScript(`
      const buttons = Array.from(document.querySelectorAll('button'));
      const buscarBtn = buttons.find(btn => btn.textContent.includes('Buscar'));

      if (buscarBtn) {
        buscarBtn.click();
        return true;
      }
      return false;
    `);

    if (!buscarSuccess) {
      throw new Error('No se encontró botón Buscar');
    }

    // PASO 3: Esperar a que aparezca el select de ruta
    console.log(`      -> Esperando carga de datos...`);

    await driver.wait(
      async (driver) => {
        const hasOptions = await driver.executeScript(`
          const selects = document.querySelectorAll('select');
          if (selects.length === 0) return false;
          return selects[0].options.length > 1;
        `);
        return hasOptions;
      },
      TIMEOUT_ELEMENT
    );

    // PASO 4: Seleccionar ruta genérica usando JavaScript
    console.log(`      -> Seleccionando ruta: ${cliente.rutaGenerica}`);

    const seleccionSuccess = await driver.executeScript(`
      const selects = document.querySelectorAll('select');
      if (selects.length === 0) return { success: false, error: 'No select found' };

      const select = selects[0];
      const rutaBuscada = arguments[0];

      for (let i = 0; i < select.options.length; i++) {
        if (select.options[i].text.includes(rutaBuscada)) {
          select.selectedIndex = i;
          select.dispatchEvent(new Event('change', { bubbles: true }));
          return { success: true, index: i };
        }
      }

      return { success: false, error: 'Ruta not found' };
    `, cliente.rutaGenerica);

    if (!seleccionSuccess.success) {
      throw new Error(`Ruta genérica "${cliente.rutaGenerica}" no encontrada en el select`);
    }

    // PASO 5: Click en botón guardar
    console.log(`      -> Guardando cambios...`);

    const guardarSuccess = await driver.executeScript(`
      const buttons = Array.from(document.querySelectorAll('button'));
      const guardarBtn = buttons.find(btn => btn.textContent.includes('Guardar'));

      if (guardarBtn) {
        guardarBtn.click();
        return true;
      }
      return false;
    `);

    if (!guardarSuccess) {
      throw new Error('No se encontró botón Guardar');
    }

    // Esperar a que se procese
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log(`   [OK] Cliente ${cliente.codigoCliente} inhabilitado correctamente`);
    return { success: true };

  } catch (error) {
    console.error(`   [ERROR] Error inhabilitando ${cliente.codigoCliente}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Procesa inhabilitación de clientes para una zona
 * @param {string} zonaNombre - Nombre de la zona (Santa Cruz, Cochabamba, La Paz)
 * @param {Array} clientes - Lista de clientes de esta zona
 * @param {string} tipoEjecucion - Tipo de ejecución (MANUAL o AUTOMATICA)
 * @param {string|null} ejecutadoPor - Nombre del supervisor que ejecutó (solo para MANUAL)
 */
async function procesarZona(zonaNombre, clientes, tipoEjecucion = 'AUTOMATICA', ejecutadoPor = null, intentoNumero = 1) {
  if (clientes.length === 0) {
    console.log(`\n[INFO] ${zonaNombre}: No hay clientes para inhabilitar`);
    return { procesados: 0, exitosos: 0, fallidos: 0 };
  }

  const intentoTexto = intentoNumero > 1 ? ` (Reintento ${intentoNumero})` : '';
  console.log(`\n[INICIO] ${zonaNombre}${intentoTexto}: ${clientes.length} clientes para inhabilitar`);

  const zona = ZONAS_DUALPOINT[zonaNombre];
  let driver = null;

  try {
    // Configurar driver Edge
    const options = new edge.Options();
    options.addArguments('--headless');
    options.addArguments('--disable-gpu');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--window-size=1920,1080');
    options.setPageLoadStrategy('eager'); // No esperar carga completa, solo DOM listo

    driver = await new Builder()
      .forBrowser('MicrosoftEdge')
      .setEdgeOptions(options)
      .build();

    await driver.manage().setTimeouts({
      pageLoad: TIMEOUT_PAGE_LOAD,
      implicit: TIMEOUT_ELEMENT
    });

    // 1. Login
    console.log(`[LOGIN] Iniciando sesión en ${zonaNombre}...`);
    console.log(`   Navegando a: ${zona.loginUrl}`);
    await driver.get(zona.loginUrl);
    console.log(`   Página de login cargada`);

    const usernameInput = await driver.wait(
      until.elementLocated(By.css(SELECTORES.usernameInput)),
      TIMEOUT_ELEMENT
    );
    await driver.wait(until.elementIsVisible(usernameInput), TIMEOUT_ELEMENT);

    const passwordInput = await driver.wait(
      until.elementLocated(By.css(SELECTORES.passwordInput)),
      TIMEOUT_ELEMENT
    );
    await driver.wait(until.elementIsVisible(passwordInput), TIMEOUT_ELEMENT);

    await usernameInput.sendKeys(process.env.DUALPOINT_USERNAME);
    await passwordInput.sendKeys(process.env.DUALPOINT_PASSWORD);

    const loginButton = await driver.wait(
      until.elementLocated(By.css(SELECTORES.loginButton)),
      TIMEOUT_ELEMENT
    );
    await driver.wait(until.elementIsVisible(loginButton), TIMEOUT_ELEMENT);
    await loginButton.click();

    // Esperar a que se complete el login (salir de login.xhtml)
    await driver.wait(
      async (driver) => {
        const url = await driver.getCurrentUrl();
        return !url.includes('login.xhtml') || url.includes('inicio.xhtml');
      },
      15000
    );

    console.log('[OK] Sesión iniciada correctamente');

    // Esperar 7 segundos y navegar directo a cambio de ruta (evita timeouts)
    console.log('[INFO] Esperando 7 segundos...');
    await new Promise(resolve => setTimeout(resolve, 7000));
    console.log(`[INFO] Navegando directamente a cambio de ruta...`);
    await driver.get(zona.cambioRutaUrl);
    await driver.wait(async (driver) => {
      const readyState = await driver.executeScript('return document.readyState');
      return readyState === 'complete';
    }, TIMEOUT_ELEMENT);
    console.log('[OK] Página de cambio de ruta cargada');

    // 2. Procesar cada cliente
    let exitosos = 0;
    let fallidos = 0;
    const detalles = [];

    for (const cliente of clientes) {
      const resultado = await inhabilitarClienteEnDualpoint(driver, cliente, zona.cambioRutaUrl);

      if (resultado.success) {
        exitosos++;
        // Marcar como inhabilitado en BD con metadata de ejecución
        await query(
          `UPDATE reportes
           SET inhabilitado_dualpoint = 1,
               fecha_inhabilitacion = NOW(),
               tipo_ejecucion_inhabilitacion = ?,
               ejecutado_por_inhabilitacion = ?
           WHERE id = ?`,
          [tipoEjecucion, ejecutadoPor, cliente.id]
        );

        detalles.push({
          codigoCliente: cliente.codigoCliente,
          nombreCliente: cliente.nombreCliente,
          zona: cliente.zona,
          rutaGenerica: cliente.rutaGenerica,
          estado: 'EXITOSO'
        });
      } else {
        fallidos++;
        detalles.push({
          codigoCliente: cliente.codigoCliente,
          nombreCliente: cliente.nombreCliente,
          zona: cliente.zona,
          rutaGenerica: cliente.rutaGenerica,
          estado: 'FALLIDO',
          error: resultado.error
        });
      }
    }

    console.log(`\n[RESUMEN ${zonaNombre}]`);
    console.log(`   Total: ${clientes.length}`);
    console.log(`   Exitosos: ${exitosos}`);
    console.log(`   Fallidos: ${fallidos}`);

    if (fallidos > 0) {
      console.log('\n[DETALLES DE FALLOS]');
      detalles.filter(d => d.estado === 'FALLIDO').forEach(d => {
        console.log(`   ❌ ${d.codigoCliente} - ${d.nombreCliente}`);
        console.log(`      Zona: ${d.zona} | Ruta: ${d.rutaGenerica}`);
        console.log(`      Error: ${d.error}`);
      });
    }

    return { procesados: clientes.length, exitosos, fallidos, detalles };

  } catch (error) {
    console.error(`[ERROR] Error en ${zonaNombre}:`, error.message);

    // Si es el primer intento y el error es timeout, reintentar
    if (intentoNumero === 1 && error.message.includes('timeout')) {
      console.log(`[REINTENTO] Reintentando ${zonaNombre} debido a timeout...`);

      // Cerrar el driver actual si existe
      if (driver) {
        try {
          await driver.quit();
        } catch (e) {
          // Ignorar errores al cerrar
        }
      }

      // Esperar 5 segundos antes de reintentar
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Reintentar con intento número 2
      return await procesarZona(zonaNombre, clientes, tipoEjecucion, ejecutadoPor, 2);
    }

    return { procesados: clientes.length, exitosos: 0, fallidos: clientes.length, error: error.message };
  } finally {
    if (driver) {
      try {
        await driver.quit();
      } catch (e) {
        // Ignorar errores al cerrar
      }
    }
  }
}

/**
 * Ejecuta la inhabilitación de todos los clientes aprobados
 * @param {string} tipoEjecucion - Tipo de ejecución (MANUAL o AUTOMATICA)
 * @param {string|null} ejecutadoPor - Nombre del supervisor que ejecutó (solo para MANUAL)
 * @returns {Promise<object>} Resultado de la inhabilitación
 */
export async function inhabilitarClientesAprobados(tipoEjecucion = 'AUTOMATICA', ejecutadoPor = null) {
  return Promise.race([
    _inhabilitarClientesAprobadosInternal(tipoEjecucion, ejecutadoPor),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout: La inhabilitación excedió 15 minutos')), TIMEOUT_GLOBAL)
    )
  ]);
}

async function _inhabilitarClientesAprobadosInternal(tipoEjecucion = 'AUTOMATICA', ejecutadoPor = null) {
  console.log('\n' + '='.repeat(60));
  console.log('INICIO: Inhabilitación Automática de Clientes Aprobados');
  console.log('='.repeat(60));

  const inicioTotal = Date.now();

  try {
    // 1. Obtener clientes aprobados
    const clientes = await obtenerClientesParaInhabilitar();

    if (clientes.length === 0) {
      console.log('[INFO] No hay clientes para inhabilitar');
      return {
        success: true,
        message: 'No hay clientes pendientes de inhabilitación',
        totalClientes: 0,
        zonas: []
      };
    }

    // 2. Agrupar por Dualpoint
    const { grupos, omitidos } = agruparClientesPorDualpoint(clientes);

    console.log('\n[DISTRIBUCION]');
    console.log(`   Santa Cruz: ${grupos['Santa Cruz'].length} clientes`);
    console.log(`   Cochabamba: ${grupos['Cochabamba'].length} clientes`);
    console.log(`   La Paz: ${grupos['La Paz'].length} clientes`);
    if (omitidos.length > 0) {
      console.log(`   Omitidos: ${omitidos.length} clientes (ver detalles al final)`);
    }

    // 3. Procesar cada zona
    const resultados = [];

    for (const [zona, clientesZona] of Object.entries(grupos)) {
      const resultado = await procesarZona(zona, clientesZona, tipoEjecucion, ejecutadoPor);
      resultados.push({
        zona,
        ...resultado
      });
    }

    // 4. Consolidar detalles de todos los clientes
    const todosLosDetalles = [];

    // Agregar detalles de procesados
    resultados.forEach(r => {
      if (r.detalles) {
        r.detalles.forEach(d => todosLosDetalles.push({ ...d, zona_dualpoint: r.zona }));
      }
    });

    // Agregar omitidos
    omitidos.forEach(o => {
      todosLosDetalles.push({
        codigoCliente: o.codigoCliente,
        nombreCliente: o.nombreCliente,
        zona: o.zona,
        estado: 'OMITIDO',
        error: o.razon
      });
    });

    // 5. Resumen final
    const totalProcesados = resultados.reduce((sum, r) => sum + r.procesados, 0);
    const totalExitosos = resultados.reduce((sum, r) => sum + r.exitosos, 0);
    const totalFallidos = resultados.reduce((sum, r) => sum + r.fallidos, 0);

    const tiempoTotal = ((Date.now() - inicioTotal) / 1000).toFixed(2);

    console.log('\n' + '='.repeat(60));
    console.log('RESUMEN FINAL');
    console.log('='.repeat(60));
    console.log(`Total encontrados: ${clientes.length}`);
    console.log(`Procesados: ${totalProcesados}`);
    console.log(`Exitosos: ${totalExitosos}`);
    console.log(`Fallidos: ${totalFallidos}`);
    console.log(`Omitidos: ${omitidos.length}`);
    console.log(`Tiempo total: ${tiempoTotal}s`);

    if (omitidos.length > 0) {
      console.log('\n[CLIENTES OMITIDOS]');
      omitidos.forEach(o => {
        console.log(`   ⚠️  ${o.codigoCliente} - ${o.nombreCliente}`);
        console.log(`      Zona: ${o.zona} | Razón: ${o.razon}`);
      });
    }

    console.log('='.repeat(60) + '\n');

    return {
      success: true,
      message: `Inhabilitación completada: ${totalExitosos}/${totalProcesados} exitosos, ${totalFallidos} fallidos, ${omitidos.length} omitidos`,
      totalClientes: clientes.length,
      procesados: totalProcesados,
      exitosos: totalExitosos,
      fallidos: totalFallidos,
      omitidos: omitidos.length,
      tiempoTotal,
      zonas: resultados,
      detalles: todosLosDetalles
    };

  } catch (error) {
    console.error('[ERROR] Error en inhabilitación:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

export default {
  inhabilitarClientesAprobados
};
