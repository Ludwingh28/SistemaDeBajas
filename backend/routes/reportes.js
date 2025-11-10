import express from "express";
import { authenticateSupervisor } from "../middleware/auth.js";
import { reportesLimiter } from "../middleware/rateLimiter.js";
import { generarReporteParaDescarga } from "../services/reportGenerator.js";
import { AppError } from "../middleware/errorHandler.js";

const router = express.Router();

/**
 * POST /api/reportes/descargar
 * Descargar reporte completo (solo supervisores)
 *
 * Body:
 * - codigoSupervisor: string (requerido)
 */
router.post(
  "/descargar",
  reportesLimiter, // Rate limit específico
  authenticateSupervisor, // Verificar código de supervisor
  async (req, res, next) => {
    try {
      console.log("📥 Descarga de reporte solicitada");
      console.log(`   IP: ${req.ip}`);
      console.log(`   Timestamp: ${new Date().toISOString()}`);

      // Generar Excel del reporte
      const buffer = await generarReporteParaDescarga();

      // Nombre del archivo con timestamp
      const fecha = new Date().toISOString().split("T")[0];
      const filename = `disqualification_report_${fecha}.xlsx`;

      // Headers para descarga
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Length", buffer.length);

      // Enviar buffer
      res.send(buffer);

      console.log(`✅ Reporte descargado: ${filename}`);
    } catch (error) {
      console.error("❌ Error generando reporte:", error);
      next(new AppError("Error generando el reporte", 500));
    }
  }
);

/**
 * GET /api/reportes/estadisticas (Opcional)
 * Obtener estadísticas del reporte sin descargar
 */
router.get("/estadisticas", async (req, res, next) => {
  try {
    const { getEstadisticasReporte } = await import("../services/reportGenerator.js");
    const stats = await getEstadisticasReporte();

    res.json(stats);
  } catch (error) {
    next(error);
  }
});

export default router;
