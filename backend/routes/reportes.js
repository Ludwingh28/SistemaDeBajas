import express from "express";
import { authenticateSupervisor } from "../middleware/auth.js";
import { reportesLimiter } from "../middleware/rateLimiter.js";
import { generarReporteParaDescarga } from "../services/reportGenerator.js";
import { AppError } from "../middleware/errorHandler.js";
import Reporte from "../models/Reporte.js";
import Zona from "../models/Zona.js";
import ExcelJS from "exceljs";

const router = express.Router();

/**
 * POST /api/reportes/descargar
 * Descargar reporte completo (solo supervisores)
 *
 * Body:
 * - codigoSupervisor: string (requerido)
 * - zona: string (código de zona o "TODOS", opcional)
 */
router.post(
  "/descargar",
  reportesLimiter, // Rate limit específico
  authenticateSupervisor, // Verificar código de supervisor
  async (req, res, next) => {
    try {
      const { zona } = req.body;

      console.log("📥 Descarga de reporte solicitada");
      console.log(`   IP: ${req.ip}`);
      console.log(`   Timestamp: ${new Date().toISOString()}`);
      if (zona) console.log(`   Zona: ${zona}`);

      // Generar Excel del reporte
      const buffer = await generarReporteParaDescarga(zona);

      // Nombre del archivo con timestamp
      const fecha = new Date().toISOString().split("T")[0];
      const zonaStr = zona && zona !== 'TODOS' ? `_zona_${zona}` : '';
      const filename = `disqualification_report_${fecha}${zonaStr}.xlsx`;

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
 * - zona: string (código de zona o "TODOS", opcional)
 */
router.post(
  "/descargar-historico",
  reportesLimiter,
  authenticateSupervisor,
  async (req, res, next) => {
    try {
      const { fechaInicio, fechaFin, zona } = req.body;

      // Validar fechas
      if (!fechaInicio || !fechaFin) {
        throw new AppError("Debe proporcionar fechaInicio y fechaFin", 400);
      }

      // Validar formato de fecha
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(fechaInicio) || !dateRegex.test(fechaFin)) {
        throw new AppError("Formato de fecha inválido. Use YYYY-MM-DD", 400);
      }

      console.log(`📥 Descarga de reporte histórico: ${fechaInicio} a ${fechaFin}${zona ? ` - Zona: ${zona}` : ''}`);

      // Obtener reportes desde MySQL
      const reportes = await Reporte.getByDateRange(fechaInicio, fechaFin, zona);

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
        { header: "Razón", key: "razon", width: 40 },
        { header: "Inhabilitado Dualpoint", key: "inhabilitado", width: 18 },
        { header: "Fecha Inhabilitación", key: "fechaInhabilitacion", width: 20 },
        { header: "Tipo Ejecución", key: "tipoEjecucion", width: 15 },
        { header: "Ejecutado Por", key: "ejecutadoPor", width: 25 }
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
          razon: r.razon || "",
          inhabilitado: r.inhabilitadoDualpoint ? "SÍ" : "NO",
          fechaInhabilitacion: r.fechaInhabilitacion ? new Date(r.fechaInhabilitacion).toLocaleString('es-BO') : "",
          tipoEjecucion: r.tipoEjecucionInhabilitacion || "",
          ejecutadoPor: r.ejecutadoPorInhabilitacion || ""
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
      const zonaStr = zona && zona !== 'TODOS' ? `_zona_${zona}` : '';
      const filename = `reporte_historico_${fechaInicio}_a_${fechaFin}${zonaStr}.xlsx`;
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

/**
 * GET /api/reportes/pendientes-aprobacion
 * Obtener solicitudes MANUAL pendientes de aprobación
 * Requiere autenticación de supervisor
 *
 * Query params (opcionales):
 * - fechaInicio: string (YYYY-MM-DD)
 * - fechaFin: string (YYYY-MM-DD)
 * - zona: string (código de zona o "TODOS")
 */
router.get(
  "/pendientes-aprobacion",
  authenticateSupervisor,
  async (req, res, next) => {
    try {
      const { fechaInicio, fechaFin, zona } = req.query;

      let pendientes;

      if (fechaInicio && fechaFin) {
        // Validar formato de fecha
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(fechaInicio) || !dateRegex.test(fechaFin)) {
          throw new AppError("Formato de fecha inválido. Use YYYY-MM-DD", 400);
        }

        console.log(`📋 Solicitudes pendientes: ${fechaInicio} a ${fechaFin}${zona ? ` - Zona: ${zona}` : ''}`);
        pendientes = await Reporte.getPendingManualApprovalsByDateRange(fechaInicio, fechaFin, zona);
      } else {
        console.log(`📋 Solicitudes pendientes: todas${zona ? ` - Zona: ${zona}` : ''}`);
        pendientes = await Reporte.getPendingManualApprovals(zona);
      }

      res.json({
        success: true,
        total: pendientes.length,
        solicitudes: pendientes
      });
    } catch (error) {
      console.error("Error obteniendo solicitudes pendientes:", error);
      next(error);
    }
  }
);

/**
 * POST /api/reportes/aprobar/:id
 * Aprobar o rechazar solicitud MANUAL
 * Requiere autenticación de supervisor
 *
 * Body:
 * - decision: "APROBADO" | "RECHAZADO"
 * - comentario: string (opcional)
 */
router.post(
  "/aprobar/:id",
  authenticateSupervisor,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { decision, comentario } = req.body;
      const supervisorNombre = req.supervisorNombre; // Del middleware de autenticación

      // Validar decision
      if (!['APROBADO', 'RECHAZADO'].includes(decision)) {
        throw new AppError('Decisión inválida. Debe ser APROBADO o RECHAZADO', 400);
      }

      // Obtener la solicitud
      const solicitud = await Reporte.getById(id);

      if (!solicitud) {
        throw new AppError('Solicitud no encontrada', 404);
      }

      if (solicitud.resultado !== 'MANUAL') {
        throw new AppError('Solo se pueden aprobar/rechazar solicitudes MANUAL', 400);
      }

      // Aprobar o rechazar
      const resultado = await Reporte.approveOrReject(
        id,
        decision,
        supervisorNombre,
        comentario
      );

      console.log(`✅ Solicitud ${id} ${decision} por ${supervisorNombre}`);

      res.json({
        success: true,
        message: `Solicitud ${decision.toLowerCase()} exitosamente`,
        decision,
        solicitud: {
          id: solicitud.id,
          codigoCliente: solicitud.codigoCliente,
          nombreCliente: solicitud.nombreCliente,
          motivo: solicitud.motivo,
          resultadoFinal: decision === 'APROBADO' ? 'SI' : 'NO',
          supervisorAprobador: supervisorNombre,
          comentario
        }
      });
    } catch (error) {
      console.error("Error aprobando/rechazando solicitud:", error);
      next(error);
    }
  }
);

/**
 * GET /api/reportes/zonas/lista
 * Obtener lista de todas las zonas disponibles
 */
router.get(
  "/zonas/lista",
  async (req, res, next) => {
    try {
      const zonas = await Zona.getAll();

      res.json({
        success: true,
        zonas: zonas.map(z => ({
          id: z.id,
          codigo: z.codigo,
          nombre: z.nombre || z.codigo
        }))
      });
    } catch (error) {
      console.error("Error obteniendo zonas:", error);
      next(error);
    }
  }
);

/**
 * GET /api/reportes/ver-historico
 * Ver reportes históricos en formato JSON (sin descargar Excel)
 * Requiere autenticación de supervisor
 *
 * Query params:
 * - fechaInicio: string (YYYY-MM-DD, requerido)
 * - fechaFin: string (YYYY-MM-DD, requerido)
 * - zona: string (código de zona o "TODOS", opcional)
 */
router.get(
  "/ver-historico",
  authenticateSupervisor,
  async (req, res, next) => {
    try {
      const { fechaInicio, fechaFin, zona } = req.query;

      // Validar fechas
      if (!fechaInicio || !fechaFin) {
        throw new AppError("Debe proporcionar fechaInicio y fechaFin", 400);
      }

      // Validar formato de fecha
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(fechaInicio) || !dateRegex.test(fechaFin)) {
        throw new AppError("Formato de fecha inválido. Use YYYY-MM-DD", 400);
      }

      console.log(`📊 Visualización de reportes: ${fechaInicio} a ${fechaFin}${zona ? ` - Zona: ${zona}` : ''}`);

      // Obtener reportes desde MySQL
      const reportes = await Reporte.getByDateRange(fechaInicio, fechaFin, zona);

      console.log(`   ✓ ${reportes.length} reportes encontrados para visualización`);

      res.json({
        success: true,
        total: reportes.length,
        fechaInicio,
        fechaFin,
        zona: zona || 'TODOS',
        reportes: reportes.map(r => ({
          id: r.id,
          fechaSolicitud: r.fechaSolicitud,
          codigoCliente: r.codigoCliente,
          nombreCliente: r.nombreCliente,
          motivo: r.motivo,
          zona: r.zona || "N/A",
          ruta: r.ruta || "N/A",
          vendedor: r.vendedor || "N/A",
          resultado: r.resultado,
          razon: r.razon || "",
          estadoAprobacion: r.estadoAprobacion,
          supervisorAprobador: r.supervisorAprobador,
          fechaAprobacion: r.fechaAprobacion,
          comentarioAprobacion: r.comentarioAprobacion,
          fotosRutas: r.fotosRutas || [],
          inhabilitadoDualpoint: r.inhabilitadoDualpoint || 0,
          fechaInhabilitacion: r.fechaInhabilitacion,
          tipoEjecucionInhabilitacion: r.tipoEjecucionInhabilitacion,
          ejecutadoPorInhabilitacion: r.ejecutadoPorInhabilitacion
        }))
      });
    } catch (error) {
      console.error("❌ Error obteniendo reportes para visualización:", error);
      next(error);
    }
  }
);

/**
 * GET /api/reportes/:id
 * Obtener detalle de solicitud por ID
 * Requiere autenticación de supervisor
 */
router.get(
  "/:id",
  authenticateSupervisor,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const solicitud = await Reporte.getById(id);

      if (!solicitud) {
        throw new AppError('Solicitud no encontrada', 404);
      }

      res.json({
        success: true,
        solicitud
      });
    } catch (error) {
      console.error("Error obteniendo solicitud:", error);
      next(error);
    }
  }
);

export default router;
