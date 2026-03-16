import dotenv from 'dotenv';

dotenv.config();

/**
 * Configuración de URLs para sistemas Dualpoint por zona
 * ✅ URLs ahora se cargan desde .env por seguridad
 */

// Validar que las URLs estén configuradas en .env
if (!process.env.DUALPOINT_SC_LOGIN || !process.env.DUALPOINT_SC_CLIENTES ||
    !process.env.DUALPOINT_CB_LOGIN || !process.env.DUALPOINT_CB_CLIENTES ||
    !process.env.DUALPOINT_LP_LOGIN || !process.env.DUALPOINT_LP_CLIENTES ||
    !process.env.DUALPOINT_SC_CAMBIO_RUTA || !process.env.DUALPOINT_CB_CAMBIO_RUTA ||
    !process.env.DUALPOINT_LP_CAMBIO_RUTA) {
  console.error('[ERROR] Faltan URLs de Dualpoint en .env');
  console.error('Se requieren: DUALPOINT_SC_LOGIN, DUALPOINT_SC_CLIENTES, DUALPOINT_CB_LOGIN, DUALPOINT_CB_CLIENTES, DUALPOINT_LP_LOGIN, DUALPOINT_LP_CLIENTES, DUALPOINT_SC_CAMBIO_RUTA, DUALPOINT_CB_CAMBIO_RUTA, DUALPOINT_LP_CAMBIO_RUTA');
}

export const ZONAS_DUALPOINT = {
  "Santa Cruz": {
    nombre: "Santa Cruz",
    codigo: "SC",
    loginUrl: process.env.DUALPOINT_SC_LOGIN,
    clientesUrl: process.env.DUALPOINT_SC_CLIENTES,
    cambioRutaUrl: process.env.DUALPOINT_SC_CAMBIO_RUTA,
  },
  Cochabamba: {
    nombre: "Cochabamba",
    codigo: "CB",
    loginUrl: process.env.DUALPOINT_CB_LOGIN,
    clientesUrl: process.env.DUALPOINT_CB_CLIENTES,
    cambioRutaUrl: process.env.DUALPOINT_CB_CAMBIO_RUTA,
  },
  "La Paz": {
    nombre: "La Paz",
    codigo: "LP",
    loginUrl: process.env.DUALPOINT_LP_LOGIN,
    clientesUrl: process.env.DUALPOINT_LP_CLIENTES,
    cambioRutaUrl: process.env.DUALPOINT_LP_CAMBIO_RUTA,
  },
};

// Rutas genéricas para inhabilitar clientes por zona y tipo
export const RUTAS_GENERICAS = {
  "Santa Cruz": {
    DTS: "SC-RUTA GENERICA",
    WHS: "SC-RUTA GENERICA",
    HORECA: "SC-RUTA GENERICA",
    DEFAULT: "SC-RUTA GENERICA"
  },
  Cochabamba: {
    DTS: "CB-RUTA GENERICA DTS",
    WHS: "CB-RUTA GENERICA",
    DEFAULT: "CB-RUTA GENERICA"
  },
  "La Paz": {
    // El Alto
    "EA-DTS": "EA-RUTA GENERICA DTS",
    "EA-WHS": "EA-RUTA GENERICA WHS",
    // La Paz
    "LP-DTS": "LP-RUTA GENERICA DTS",
    "LP-WHS": "LP-RUTA GENERICA WHS",
    "LP-HORECA": "LP-RUTA GENERICA HORECA",
    // NOTA: LICORES no usa este sistema de inhabilitación
    DEFAULT: "LP-RUTA GENERICA DTS"
  }
};

// IDs y selectores comunes en el sistema Dualpoint
export const SELECTORES = {
  // Login - Usar estrategia que funciona (por tipo)
  usernameInput: 'input[type="text"]',
  passwordInput: 'input[type="password"]',
  loginButton: 'button[type="submit"]',

  // Página de clientes - Buscar por ID y texto
  exportButton: "#form\\:j_idt26",
  exportButtonText: '//button[contains(@class, "ui-button")]//span[text()="Exportar"]',

  // Página de cambio de ruta
  cambioRuta: {
    inputCodigo: 'input[type="text"]', // Input para código de cliente
    btnBuscar: '//button[contains(., "Buscar")]',
    selectRuta: 'select', // Dropdown de rutas
    btnGuardar: '//button[contains(., "Guardar")]'
  }
};

/**
 * Determina el tipo de cliente basado en la zona
 * @param {string} zona - Zona del cliente (ej: "DTS1 SC", "WHS LP", "Horeca")
 * @returns {string} Tipo de cliente (DTS, WHS, HORECA, LICORES)
 */
export function obtenerTipoCliente(zona) {
  if (!zona) return 'DTS'; // Default

  const zonaUpper = zona.toUpperCase();

  if (zonaUpper.includes('DTS')) return 'DTS';
  if (zonaUpper.includes('WHS')) return 'WHS';
  if (zonaUpper.includes('HORECA')) return 'HORECA';
  if (zonaUpper.includes('LICOR')) return 'LICORES';

  return 'DTS'; // Default
}

/**
 * Determina la regional (SC, CB, LP, EA) basado en la zona
 * @param {string} zona - Zona del cliente
 * @returns {string} Código de regional
 */
export function obtenerRegional(zona) {
  if (!zona) return null;

  const zonaUpper = zona.toUpperCase();

  if (zonaUpper.includes('SC') || zonaUpper.includes('SANTA CRUZ')) return 'SC';
  if (zonaUpper.includes('CB') || zonaUpper.includes('CBBA') || zonaUpper.includes('COCHABAMBA')) return 'CB';
  if (zonaUpper.includes('EA') || zonaUpper.includes('EL ALTO')) return 'EA';
  if (zonaUpper.includes('LP') || zonaUpper.includes('LA PAZ')) return 'LP';

  return null;
}

/**
 * Obtiene la ruta genérica correcta para un cliente según su zona
 * @param {string} zona - Zona del cliente
 * @returns {object|null} {dualpoint: string, rutaGenerica: string} o null si no debe inhabilitarse
 */
export function obtenerRutaGenerica(zona) {
  const regional = obtenerRegional(zona);
  const tipo = obtenerTipoCliente(zona);

  // LICORES no usa el sistema de inhabilitación
  if (tipo === 'LICORES') {
    return null;
  }

  let dualpoint = null;
  let rutaGenerica = null;

  switch (regional) {
    case 'SC':
      dualpoint = 'Santa Cruz';
      rutaGenerica = RUTAS_GENERICAS["Santa Cruz"][tipo] || RUTAS_GENERICAS["Santa Cruz"].DEFAULT;
      break;

    case 'CB':
      dualpoint = 'Cochabamba';
      rutaGenerica = RUTAS_GENERICAS.Cochabamba[tipo] || RUTAS_GENERICAS.Cochabamba.DEFAULT;
      break;

    case 'EA':
      dualpoint = 'La Paz';
      const claveEA = `EA-${tipo}`;
      rutaGenerica = RUTAS_GENERICAS["La Paz"][claveEA] || RUTAS_GENERICAS["La Paz"].DEFAULT;
      break;

    case 'LP':
      dualpoint = 'La Paz';
      const claveLP = `LP-${tipo}`;
      rutaGenerica = RUTAS_GENERICAS["La Paz"][claveLP] || RUTAS_GENERICAS["La Paz"].DEFAULT;
      break;

    default:
      console.warn(`[WARN] Regional no identificada para zona: ${zona}`);
      return null;
  }

  return { dualpoint, rutaGenerica };
}

export default {
  ZONAS_DUALPOINT,
  RUTAS_GENERICAS,
  SELECTORES,
  obtenerTipoCliente,
  obtenerRegional,
  obtenerRutaGenerica
};
