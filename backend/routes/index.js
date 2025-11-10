import express from "express";
import bajasRouter from "./bajas.js";
import motivosRouter from "./motivos.js";
import reportesRouter from "./reportes.js";
import { generalLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// Aplicar rate limiter general a todas las rutas
router.use(generalLimiter);

// Rutas
router.use("/bajas", bajasRouter);
router.use("/motivos", motivosRouter);
router.use("/reportes", reportesRouter);

// Ruta de prueba
router.get("/test", (req, res) => {
  res.json({
    message: "API funcionando correctamente",
    timestamp: new Date().toISOString(),
    endpoints: {
      bajas: "POST /api/bajas/solicitar",
      motivos: "GET /api/motivos",
      reportes: "POST /api/reportes/descargar",
    },
  });
});

export default router;
