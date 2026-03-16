import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import dotenv from "dotenv";
import routes from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { loadExcelDataOnStartup } from "./services/excelReader.js";
import { verificarConexion } from "./config/mysql.js";
import { iniciarScheduler, detenerScheduler } from "./config/scheduler.js";

// Cargar variables de entorno
dotenv.config();

// ========================================
// Validar variables de entorno críticas
// ========================================
const requiredEnvVars = [
  'DB_HOST',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'SUPERVISOR_CODES',
  'DUALPOINT_USERNAME',
  'DUALPOINT_PASSWORD',
  'DUALPOINT_SC_LOGIN',
  'DUALPOINT_SC_CLIENTES',
  'DUALPOINT_SC_CAMBIO_RUTA',
  'DUALPOINT_CB_LOGIN',
  'DUALPOINT_CB_CLIENTES',
  'DUALPOINT_CB_CAMBIO_RUTA',
  'DUALPOINT_LP_LOGIN',
  'DUALPOINT_LP_CLIENTES',
  'DUALPOINT_LP_CAMBIO_RUTA',
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('\n' + '='.repeat(60));
  console.error('[ERROR] Faltan variables de entorno criticas');
  console.error('='.repeat(60));
  missingVars.forEach(varName => {
    console.error(`  - ${varName}`);
  });
  console.error('\nVerifica tu archivo .env y asegurate de que todas');
  console.error('las variables requeridas esten configuradas.');
  console.error('='.repeat(60) + '\n');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares de seguridad y optimización
app.use(helmet());
app.use(compression());
app.use(morgan("dev"));

// CORS - Permitir requests del frontend (desarrollo y producción)
const allowedOrigins = [
  "http://localhost:5173",  // Desarrollo local
  "http://127.0.0.1:5173",  // Desarrollo local alternativo
  process.env.FRONTEND_URL  // Producción (desde .env)
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Permitir requests sin origin (como Postman, curl, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.warn(`[CORS] Origen bloqueado: ${origin}`);
        callback(null, false);
      }
    },
    credentials: true,
  })
);

// Parsear JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (uploads de fotos)
app.use("/uploads", express.static("uploads"));

// Rutas principales
app.use("/api", routes);

// Ruta de health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Backend funcionando correctamente",
    timestamp: new Date().toISOString(),
  });
});

// Manejo de errores centralizado
app.use(errorHandler);

// Inicializar servidor
async function startServer() {
  try {
    // 1. Verificar conexión a MySQL
    console.log("[STARTUP] Verificando conexion a MySQL...");
    const mysqlOk = await verificarConexion();

    if (!mysqlOk) {
      console.warn("[WARN] MySQL no disponible. El sistema continuara pero sin persistencia en BD.");
    }

    // 2. Cargar datos necesarios (solo si MySQL no está disponible)
    if (!mysqlOk) {
      console.warn("[WARN] MySQL no disponible - Cargando Excel a memoria como fallback");
      await loadExcelDataOnStartup();
    }

    // 3. Iniciar scheduler de sincronizaciones (6 AM, 7 PM, Sab 9 AM, Sab 12 PM)
    if (mysqlOk) {
      iniciarScheduler();
    }

    // 4. Iniciar servidor
    app.listen(PORT, "0.0.0.0", () => {
      console.log("========================================");
      console.log("   Servidor Backend Iniciado");
      console.log("========================================");
      console.log(`Puerto: ${PORT}`);
      console.log(`Entorno: ${process.env.NODE_ENV || "development"}`);
      console.log(`URL Local: http://localhost:${PORT}`);
      if (mysqlOk) {
        console.log(`MySQL: Conectado`);
        console.log(`Consultas: Directo desde DB`);
        console.log(`Scheduler: Activo (6 AM, 7 PM, Sab 9 AM, Sab 12 PM)`);
      } else {
        console.log(`Modo: Fallback con Excel en memoria`);
      }
      console.log("========================================\n");
    });
  } catch (error) {
    console.error("[ERROR] Error al iniciar servidor:", error.message);
    process.exit(1);
  }
}

// Iniciar
startServer();

// Manejo de cierre graceful
process.on("SIGTERM", () => {
  console.log("[SHUTDOWN] SIGTERM recibido, cerrando servidor...");
  detenerScheduler();
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("\n[SHUTDOWN] SIGINT recibido, cerrando servidor...");
  detenerScheduler();
  process.exit(0);
});

export default app;
