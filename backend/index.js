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

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares de seguridad y optimización
app.use(helmet());
app.use(compression());
app.use(morgan("dev"));

// CORS - Permitir requests del frontend
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
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
    console.log("🔍 Verificando conexión a MySQL...");
    const mysqlOk = await verificarConexion();

    if (!mysqlOk) {
      console.warn("⚠️  MySQL no disponible. El sistema continuará pero sin persistencia en BD.");
    }

    // 2. Cargar solo datos necesarios en cache (skip ventas/clientes si hay MySQL)
    if (mysqlOk) {
      console.log("✅ MySQL disponible - Ventas y Clientes se consultan desde DB");
      console.log("⏭️  Skipping carga de Excel a memoria (optimización)");
    } else {
      console.warn("⚠️  MySQL no disponible - Cargando Excel a memoria como fallback");
      await loadExcelDataOnStartup();
    }

    // 3. Iniciar scheduler de sincronizaciones (6 AM y 7 PM)
    if (mysqlOk) {
      iniciarScheduler();
    }

    // 4. Iniciar servidor
    app.listen(PORT, "0.0.0.0", () => {
      console.log("╔════════════════════════════════════════╗");
      console.log("║   🚀 Servidor Backend Iniciado        ║");
      console.log("╚════════════════════════════════════════╝");
      console.log(`📍 Puerto: ${PORT}`);
      console.log(`🌍 Entorno: ${process.env.NODE_ENV || "development"}`);
      console.log(`🔗 URL Local: http://localhost:${PORT}`);
      if (mysqlOk) {
        console.log(`✅ MySQL conectado`);
        console.log(`✅ Consultas directo desde DB (optimizado)`);
        console.log(`✅ Scheduler activo (sync: 6 AM y 7 PM)`);
      } else {
        console.log(`⚠️  Modo fallback con Excel en memoria`);
      }
      console.log("════════════════════════════════════════\n");
    });
  } catch (error) {
    console.error("❌ Error al iniciar servidor:", error.message);
    process.exit(1);
  }
}

// Iniciar
startServer();

// Manejo de cierre graceful
process.on("SIGTERM", () => {
  console.log("⚠️  SIGTERM recibido, cerrando servidor...");
  detenerScheduler();
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("\n⚠️  SIGINT recibido, cerrando servidor...");
  detenerScheduler();
  process.exit(0);
});

export default app;
