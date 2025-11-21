import express from "express";
import { authenticateSupervisor } from "../middleware/auth.js";
import { reportesLimiter } from "../middleware/rateLimiter.js";
import { generarReporteParaDescarga } from "../services/reportGenerator.js";
import { AppError } from "../middleware/errorHandler.js";
import Reporte from "../models/Reporte.js";
import ExcelJS from "exceljs";

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
 * POST /api/reportes/descargar-historico
 * Descargar reporte histórico por rango de fechas desde MySQL (solo supervisores)
 *
 * Body:
 * - codigoSupervisor: string (requerido)
 * - fechaInicio: string (YYYY-MM-DD, requerido)
 * - fechaFin: string (YYYY-MM-DD, requerido)
 */
router.post(
  "/descargar-historico",
  reportesLimiter,
  authenticateSupervisor,
  async (req, res, next) => {
    try {
      const { fechaInicio, fechaFin } = req.body;

      // Validar fechas
      if (!fechaInicio || !fechaFin) {
        throw new AppError("Debe proporcionar fechaInicio y fechaFin", 400);
      }

      // Validar formato de fecha
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(fechaInicio) || !dateRegex.test(fechaFin)) {
        throw new AppError("Formato de fecha inválido. Use YYYY-MM-DD", 400);
      }

      console.log(`📥 Descarga de reporte histórico: ${fechaInicio} a ${fechaFin}`);

      // Obtener reportes desde MySQL
      const reportes = await Reporte.getByDateRange(fechaInicio, fechaFin);

      if (reportes.length === 0) {
        throw new AppError("No hay reportes en el rango de fechas seleccionado", 404);
      }

      // Crear Excel
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Reportes");

      // Configurar columnas
      worksheet.columns = [
        { header: "Fecha Solicitud", key: "fecha", width: 20 },
        { header: "Código Cliente", key: "codigo", width: 15 },
        { header: "Nombre Cliente", key: "nombre", width: 30 },
        { header: "Motivo", key: "motivo", width: 25 },
        { header: "Zona", key: "zona", width: 15 },
        { header: "Ruta", key: "ruta", width: 15 },
        { header: "Vendedor", key: "vendedor", width: 25 },
        { header: "Resultado", key: "resultado", width: 12 },
        { header: "Razón", key: "razon", width: 40 }
      ];

      // Agregar datos
      reportes.forEach(r => {
        worksheet.addRow({
          fecha: new Date(r.fechaSolicitud).toLocaleString('es-BO'),
          codigo: r.codigoCliente,
          nombre: r.nombreCliente,
          motivo: r.motivo,
          zona: r.zona || "N/A",
          ruta: r.ruta || "N/A",
          vendedor: r.vendedor || "N/A",
          resultado: r.resultado,
          razon: r.razon || ""
        });
      });

      // Estilizar encabezados
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

      // Generar buffer
      const buffer = await workbook.xlsx.writeBuffer();

      // Enviar archivo
      const filename = `reporte_historico_${fechaInicio}_a_${fechaFin}.xlsx`;
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Length", buffer.length);
      res.send(buffer);

      console.log(`✅ Reporte histórico descargado: ${reportes.length} registros`);
    } catch (error) {
      console.error("❌ Error generando reporte histórico:", error);
      next(error);
    }
  }
);

/**
 * GET /api/reportes/estadisticas
 * Obtener estadísticas desde MySQL
 */
router.get("/estadisticas", async (req, res, next) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    let stats;
    if (fechaInicio && fechaFin) {
      stats = await Reporte.getEstadisticas(fechaInicio, fechaFin);
      stats.rango = { fechaInicio, fechaFin };
    } else {
      stats = await Reporte.getEstadisticasHoy();
      stats.fecha = new Date().toISOString().split('T')[0];
    }

    res.json(stats);
  } catch (error) {
    next(error);
  }
});

export default router;
