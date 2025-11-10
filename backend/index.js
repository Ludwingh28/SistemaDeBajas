import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import dotenv from "dotenv";
import routes from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { loadExcelDataOnStartup } from "./services/excelReader.js";

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

// Cargar datos de Excel al iniciar servidor
loadExcelDataOnStartup()
  .then(() => {
    // Iniciar servidor
    app.listen(PORT, "0.0.0.0", () => {
      console.log("╔════════════════════════════════════════╗");
      console.log("║   🚀 Servidor Backend Iniciado        ║");
      console.log("╚════════════════════════════════════════╝");
      console.log(`📍 Puerto: ${PORT}`);
      console.log(`🌍 Entorno: ${process.env.NODE_ENV || "development"}`);
      console.log(`🔗 URL Local: http://localhost:${PORT}`);
      console.log(`✅ Excel cargados en memoria`);
      console.log("════════════════════════════════════════\n");
    });
  })
  .catch((error) => {
    console.error("❌ Error al cargar Excel:", error.message);
    process.exit(1);
  });

// Manejo de cierre graceful
process.on("SIGTERM", () => {
  console.log("⚠️  SIGTERM recibido, cerrando servidor...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("\n⚠️  SIGINT recibido, cerrando servidor...");
  process.exit(0);
});

export default app;
