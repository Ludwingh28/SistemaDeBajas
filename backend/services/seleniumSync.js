import { Builder, By, until } from 'selenium-webdriver';
import edge from 'selenium-webdriver/edge.js';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { ZONAS_DUALPOINT, SELECTORES } from '../config/dualpoint.js';
import { importarClientesDesdeExcel } from './clientesImporter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directorio para descargas temporales
const DOWNLOADS_DIR = path.join(__dirname, '..', 'downloads');

/**
 * Asegura que el directorio de descargas existe
 */
async function asegurarDirectorioDescargas() {
  try {
    await fs.access(DOWNLOADS_DIR);
  } catch {
    await fs.mkdir(DOWNLOADS_DIR, { recursive: true });
    console.log(`📁 Directorio de descargas creado: ${DOWNLOADS_DIR}`);
  }
}

/**
 * Limpia archivos antiguos del directorio de descargas
 */
async function limpiarDescargas() {
  try {
    const files = await fs.readdir(DOWNLOADS_DIR);
    for (const file of files) {
      await fs.unlink(path.join(DOWNLOADS_DIR, file));
    }
    console.log('🗑️  Directorio de descargas limpiado');
  } catch (error) {
    console.warn('⚠️  No se pudo limpiar directorio de descargas:', error.message);
  }
}

/**
 * Espera a que aparezca un archivo de descarga
 * @param {string} fileName - Nombre del archivo esperado
 * @param {number} timeout - Timeout en milisegundos
 */
async function esperarDescarga(fileName, timeout = 30000) {
  const filePath = path.join(DOWNLOADS_DIR, fileName);
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const stats = await fs.stat(filePath);
      if (stats.size > 0) {
        // Esperar un poco más para asegurar que la descarga completó
        await new Promise(resolve => setTimeout(resolve, 1000));
        return filePath;
      }
    } catch {
      // Archivo aún no existe
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  throw new Error(`Timeout esperando descarga de ${fileName}`);
}

/**
 * Configura el driver de Edge con opciones de descarga
 */
async function configurarDriver() {
  await asegurarDirectorioDescargas();

  console.log('🔧 Configurando Microsoft Edge WebDriver...');

  const options = new edge.Options();

  // Modo headless para producción (sin ventana visible)
  options.addArguments('--headless');
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  options.addArguments('--disable-gpu');
  options.addArguments('--window-size=1920,1080');
  options.addArguments('--disable-blink-features=AutomationControlled');
  // NO usar --inprivate para evitar validación física en HTTP

  // Configurar directorio de descargas
  const downloadPrefs = {
    'download.default_directory': DOWNLOADS_DIR,
    'download.prompt_for_download': false,
    'download.directory_upgrade': true,
    'safebrowsing.enabled': false
  };

  options.setUserPreferences(downloadPrefs);

  console.log(`   📁 Directorio de descargas: ${DOWNLOADS_DIR}`);

  try {
    const driver = await new Builder()
      .forBrowser('MicrosoftEdge')
      .setEdgeOptions(options)
      .build();

    console.log('   ✓ Microsoft Edge WebDriver iniciado correctamente');
    return driver;
  } catch (error) {
    console.error('   ❌ Error iniciando Edge WebDriver:', error.message);
    throw new Error(`No se pudo iniciar Microsoft Edge. Error: ${error.message}`);
  }
}

/**
 * Descarga clientes desde un sistema Dualpoint
 * @param {WebDriver} driver - Instancia de Selenium WebDriver
 * @param {Object} zona - Configuración de zona desde ZONAS_DUALPOINT
 * @param {string} username - Usuario de Dualpoint
 * @param {string} password - Contraseña de Dualpoint
 */
async function descargarClientesDeZona(driver, zona, username, password) {
  console.log(`\n🔄 Procesando zona: ${zona.nombre} (${zona.codigo})`);

  try {
    // 1. Navegar a página de login
    console.log(`   ➡️  Navegando a: ${zona.loginUrl}`);
    await driver.get(zona.loginUrl);
    console.log(`   ✓ Página cargada, esperando formulario de login...`);

    // Esperar a que cargue el formulario de login
    await driver.wait(
      until.elementLocated(By.css(SELECTORES.usernameInput)),
      10000
    );

    // Buscar campos de login (estrategia directa que funciona)
    console.log(`   🔍 Buscando campos de login...`);

    // Buscar primer input de texto (usuario)
    const inputs = await driver.findElements(By.css(SELECTORES.usernameInput));
    if (inputs.length === 0) {
      throw new Error('No se encontró campo de usuario');
    }
    const usernameInput = inputs[0];
    console.log(`   ✓ Campo usuario encontrado`);

    // Buscar campo de contraseña
    const passwordInput = await driver.findElement(By.css(SELECTORES.passwordInput));
    console.log(`   ✓ Campo contraseña encontrado`);

    // Buscar botón de login
    const loginButton = await driver.findElement(By.css(SELECTORES.loginButton));
    console.log(`   ✓ Botón login encontrado`);

    // 4. Ingresar credenciales y hacer login
    console.log('   🔐 Ingresando credenciales...');

    await usernameInput.clear();
    await usernameInput.sendKeys(username);
    console.log(`   ✓ Usuario ingresado: ${username}`);

    await passwordInput.clear();
    await passwordInput.sendKeys(password);
    console.log(`   ✓ Contraseña ingresada`);

    await loginButton.click();
    console.log(`   ✓ Click en botón de login`);

    // 5. Esperar a que procese el login y redirija
    console.log('   ⏳ Esperando procesamiento de login...');

    let currentUrl;
    try {
      // Esperar a que cambie la URL (salga de login.xhtml)
      await driver.wait(
        async (driver) => {
          const url = await driver.getCurrentUrl();
          return !url.includes('login.xhtml') || url.includes('inicio.xhtml');
        },
        15000 // 15 segundos máximo
      );

      currentUrl = await driver.getCurrentUrl();
      console.log(`   ℹ️  URL después de login: ${currentUrl}`);
    } catch (e) {
      console.error(`   ❌ Error esperando redirección después del login: ${e.message}`);
      throw new Error('No se pudo completar el login. El servidor puede estar lento o las credenciales son incorrectas.');
    }

    // Verificar que la URL no sea null
    if (!currentUrl) {
      throw new Error('URL es null después del login. Posible error de conexión o navegador cerrado.');
    }

    // Verificar si seguimos en la página de login (login falló)
    if (currentUrl.includes('login.xhtml')) {
      // Tomar screenshot del error
      try {
        const screenshot = await driver.takeScreenshot();
        const screenshotPath = path.join(DOWNLOADS_DIR, `debug_${zona.codigo}_login_failed.png`);
        await fs.writeFile(screenshotPath, screenshot, 'base64');
        console.log(`   📸 Screenshot de login fallido guardado: ${screenshotPath}`);
      } catch (e) {}

      throw new Error('Login falló: aún estamos en la página de login. Verifica credenciales.');
    }

    console.log(`   ✓ Login procesado, navegando a página de clientes...`);

    // 6. Navegar directamente a la página de clientes
    console.log(`   ➡️  Navegando a: ${zona.clientesUrl}`);
    await driver.get(zona.clientesUrl);

    console.log('   ⏳ Esperando carga de página de clientes...');
    // Esperar a que la URL contenga 'cliente' O que aparezca el botón de exportar
    await driver.wait(
      async (driver) => {
        const url = await driver.getCurrentUrl();
        if (url.includes('cliente')) return true;
        try {
          await driver.findElement(By.css(SELECTORES.exportButton));
          return true;
        } catch {
          return false;
        }
      },
      15000
    );

    currentUrl = await driver.getCurrentUrl();

    // Verificar que estamos en la página correcta
    if (!currentUrl.includes('cliente')) {
      console.warn(`   ⚠️  ADVERTENCIA: No estamos en la página de clientes. URL: ${currentUrl}`);
    } else {
      console.log('   ✓ Confirmado: estamos en la página de clientes');
    }

    // 7. Limpiar descargas previas
    const downloadFileName = `clientes_${zona.codigo}.xls`;
    const tempDownloadPath = path.join(DOWNLOADS_DIR, 'clientes.xls');
    try {
      await fs.unlink(tempDownloadPath);
    } catch {}

    // 8. Click en botón de exportar (estrategia optimizada)
    console.log('   📥 Buscando botón de exportar...');
    let exportClicked = false;

    // Buscar el botón por ID #form:j_idt26 y hacer click con JavaScript
    try {
      const exportButton = await driver.findElement(By.css(SELECTORES.exportButton));
      console.log('   ✓ Botón de exportar encontrado (form:j_idt26)');

      // Usar JavaScript directamente para evitar problemas de elementos que interceptan
      await driver.executeScript('arguments[0].scrollIntoView({behavior: "smooth", block: "center"});', exportButton);

      // Esperar a que el botón esté visible después del scroll
      await driver.wait(until.elementIsVisible(exportButton), 5000);

      // Intentar click normal primero
      try {
        await exportButton.click();
        exportClicked = true;
        console.log('   ✓ Click exitoso con Selenium');
      } catch (clickError) {
        // Si falla, usar JavaScript
        console.log('   🔧 Usando JavaScript para hacer click...');
        await driver.executeScript('arguments[0].click();', exportButton);
        exportClicked = true;
        console.log('   ✓ Click exitoso con JavaScript');
      }
    } catch (error) {
      console.error(`   ❌ No se encontró el botón de exportar: ${error.message}`);
      console.error('   💡 Revisa el screenshot en: backend/downloads/debug_' + zona.codigo + '_clientes.png');
      throw new Error('No se pudo encontrar el botón de exportar (form:j_idt26)');
    }

    if (!exportClicked) {
      throw new Error('No se pudo hacer click en el botón de exportar');
    }

    // 9. Esperar a que termine la descarga
    console.log('   ⏳ Esperando descarga del archivo...');

    const downloadedFile = await esperarDescarga('clientes.xls', 30000);
    console.log(`   ✓ Archivo descargado: ${downloadedFile}`);

    // 10. Renombrar archivo para identificar la zona
    const finalPath = path.join(DOWNLOADS_DIR, downloadFileName);
    await fs.rename(downloadedFile, finalPath);
    console.log(`   ✓ Archivo renombrado a: ${downloadFileName}`);

    return {
      success: true,
      zona: zona.nombre,
      codigo: zona.codigo,
      filePath: finalPath
    };

  } catch (error) {
    console.error(`   ❌ Error descargando clientes de ${zona.nombre}:`);
    console.error(`   Error: ${error.message}`);
    if (error.stack) {
      console.error(`   Stack: ${error.stack.split('\n').slice(0, 3).join('\n')}`);
    }
    return {
      success: false,
      zona: zona.nombre,
      codigo: zona.codigo,
      error: error.message
    };
  }
}

/**
 * Timeout global para evitar procesos colgados indefinidamente
 * 15 minutos = 900,000 ms (suficiente para 3 zonas con reintentos)
 */
const TIMEOUT_GLOBAL = 15 * 60 * 1000; // 15 minutos

/**
 * Sincroniza clientes desde todos los sistemas Dualpoint
 * Descarga archivos .xls de cada zona e importa a la base de datos
 * @param {boolean} reemplazar - Si true, reemplaza todos los datos. Si false, actualiza/agrega
 * @returns {Promise<Object>} Resultado de la sincronización
 */
export async function sincronizarClientesDualpoint(reemplazar = false) {
  // ✅ Timeout global para prevenir procesos colgados
  return Promise.race([
    _sincronizarClientesDualpointInternal(reemplazar),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout: La sincronización excedió 15 minutos')), TIMEOUT_GLOBAL)
    )
  ]);
}

/**
 * Implementación interna de la sincronización (con timeout global)
 */
async function _sincronizarClientesDualpointInternal(reemplazar) {
  let driver;

  try {
    console.log('\n🚀 Iniciando sincronización de clientes desde Dualpoint');
    console.log(`   Modo: ${reemplazar ? 'REEMPLAZAR' : 'AGREGAR/ACTUALIZAR'}`);
    console.log(`   Zonas a procesar: ${Object.keys(ZONAS_DUALPOINT).length}`);

    // Obtener credenciales
    const username = process.env.DUALPOINT_USERNAME;
    const password = process.env.DUALPOINT_PASSWORD;

    if (!username || !password) {
      throw new Error('Credenciales de Dualpoint no configuradas en .env');
    }

    // Limpiar descargas previas
    await limpiarDescargas();

    // Configurar Selenium
    console.log('\n🌐 Configurando Selenium WebDriver...');
    driver = await configurarDriver();
    console.log('   ✓ WebDriver configurado');

    // Descargar archivos de cada zona
    const resultadosDescarga = [];
    for (const [nombreZona, configZona] of Object.entries(ZONAS_DUALPOINT)) {
      try {
        const resultado = await descargarClientesDeZona(driver, configZona, username, password);
        resultadosDescarga.push(resultado);
      } catch (error) {
        console.error(`\n❌ Error fatal procesando ${nombreZona}:`, error.message);
        resultadosDescarga.push({
          success: false,
          zona: configZona.nombre,
          codigo: configZona.codigo,
          error: error.message
        });

        // Verificar si el navegador sigue abierto
        try {
          await driver.getCurrentUrl();
          console.log('   ℹ️  Navegador sigue abierto, continuando con siguiente zona...');
        } catch (e) {
          console.error('   ❌ Navegador cerrado prematuramente, no se pueden procesar más zonas');
          break;
        }
      }
    }

    // Cerrar navegador si todavía está abierto
    try {
      await driver.quit();
      console.log('\n🌐 Navegador cerrado');
    } catch (e) {
      console.log('\n🌐 Navegador ya estaba cerrado');
    }

    // Importar archivos descargados
    console.log('\n📊 Importando clientes a la base de datos...');
    const resultadosImportacion = [];

    for (const descarga of resultadosDescarga) {
      if (!descarga.success) {
        resultadosImportacion.push({
          zona: descarga.zona,
          success: false,
          error: `No se pudo descargar: ${descarga.error}`
        });
        continue;
      }

      try {
        console.log(`\n   Importando ${descarga.zona}...`);
        const resultado = await importarClientesDesdeExcel(
          descarga.filePath,
          reemplazar && resultadosImportacion.length === 0, // Solo reemplazar en la primera importación
          `clientes_${descarga.codigo}.xls`
        );

        resultadosImportacion.push({
          zona: descarga.zona,
          codigo: descarga.codigo,
          success: resultado.success,
          registros: resultado.registros,
          estadisticas: resultado.estadisticas
        });

        // Eliminar archivo temporal después de importar
        await fs.unlink(descarga.filePath);
        console.log(`   🗑️  Archivo temporal eliminado: ${descarga.filePath}`);

      } catch (error) {
        console.error(`   ❌ Error importando ${descarga.zona}:`, error.message);
        resultadosImportacion.push({
          zona: descarga.zona,
          success: false,
          error: error.message
        });
      }
    }

    // Limpiar directorio de descargas
    await limpiarDescargas();

    // Resumen final
    const exitosas = resultadosImportacion.filter(r => r.success).length;
    const fallidas = resultadosImportacion.filter(r => !r.success).length;
    const totalRegistros = resultadosImportacion
      .filter(r => r.success)
      .reduce((sum, r) => sum + (r.registros || 0), 0);

    console.log('\n✅ Sincronización completada:');
    console.log(`   ✓ Zonas exitosas: ${exitosas}`);
    console.log(`   ❌ Zonas fallidas: ${fallidas}`);
    console.log(`   📊 Total registros importados: ${totalRegistros}\n`);

    return {
      success: exitosas > 0,
      message: `Sincronización completada: ${exitosas}/${resultadosDescarga.length} zonas exitosas`,
      zonas: resultadosImportacion,
      totalRegistros: totalRegistros,
      zonasExitosas: exitosas,
      zonasFallidas: fallidas
    };

  } catch (error) {
    console.error('\n❌ Error fatal en sincronización:', error);

    // Asegurar que el driver se cierre
    if (driver) {
      try {
        await driver.quit();
      } catch {}
    }

    return {
      success: false,
      message: `Error en sincronización: ${error.message}`,
      error: error.message
    };
  }
}

export default {
  sincronizarClientesDualpoint
};
