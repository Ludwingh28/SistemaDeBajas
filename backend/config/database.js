import NodeCache from "node-cache";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const cache = new NodeCache({
  stdTTL: parseInt(process.env.CACHE_TTL) || 3600,
  checkperiod: 120,
  useClones: false,
});

export const paths = {
  data: path.join(__dirname, "..", "data"),
  uploads: path.join(__dirname, "..", "uploads"),
  reportes: path.join(__dirname, "..", "reportes"),
  logs: path.join(__dirname, "..", "logs"),

  // Archivos específicos
  excelVentas: path.join(__dirname, "..", "data", process.env.EXCEL_VENTAS || "ventas_nuevito.xlsx"),
  excelRutas: path.join(__dirname, "..", "data", process.env.EXCEL_RUTAS || "rutas_vendedores.xlsx"),
  motivosFile: path.join(__dirname, "..", "data", process.env.MOTIVOS_FILE || "motivos.txt"),
  solicitudesLog: path.join(__dirname, "..", "logs", "solicitudes.json"),
  reporteDisqualification: path.join(__dirname, "..", "reportes", "disqualification report.xlsx"),
};

export const cacheConfig = {
  MOTIVOS_KEY: "motivos_data",
};

export const getCachedData = (key) => cache.get(key);
export const setCachedData = (key, data) => cache.set(key, data);
export const clearCache = () => cache.flushAll();
export const getCacheStats = () => cache.getStats();
