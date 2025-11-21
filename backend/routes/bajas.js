import express from "express";
import { uploadPhotos, cleanupUploads } from "../middleware/uploadHandler.js";
import { bajasLimiter } from "../middleware/rateLimiter.js";
import { validateRequiredFields } from "../middleware/auth.js";
import { validarCliente } from "../services/validator.js";
import { agregarSolicitudAlReporte } from "../services/reportGenerator.js";
import { logSolicitud } from "../logs/logger.js";
import { AppError } from "../middleware/errorHandler.js";
import Reporte from "../models/Reporte.js";

const router = express.Router();

/**
 * POST /api/bajas/solicitar
 * Solicitar inhabilitación de un cliente
 *
 * Body (multipart/form-data):
 * - codigoCliente: string (requerido)
 * - motivo: string (requerido)
 * - fotos: File[] (requerido, 1-5 archivos)
 */
router.post(
  "/solicitar",
  bajasLimiter, // Rate limit específico
  cleanupUploads, // Limpiar archivos si hay error
  uploadPhotos, // Procesar upload de fotos
  validateRequiredFields(["codigoCliente", "motivo"]), // Validar campos
  async (req, res, next) => {
    try {
      const { codigoCliente, motivo } = req.body;

      console.log("\n" + "=".repeat(60));
      console.log("📥 Nueva solicitud de baja");
      console.log("=".repeat(60));
      console.log(`Código Cliente: ${codigoCliente}`);
      console.log(`Motivo: ${motivo}`);
      console.log(`Fotos: ${req.files.length}`);
      console.log(`IP: ${req.ip}`);
      console.log("=".repeat(60) + "\n");

      // 1. Validar cliente
      const resultado = validarCliente(codigoCliente, motivo);

      // 2. Agregar al reporte de supervisores (Excel)
      await agregarSolicitudAlReporte(resultado);

      // 3. Guardar en base de datos MySQL (histórico)
      try {
        const fotosRutas = req.files ? req.files.map(f => f.path) : [];
        await Reporte.create({
          codigoCliente: resultado.codigoCliente,
          nombreCliente: resultado.nombreCliente,
          motivo: motivo,
          zona: resultado.zona || null,
          ruta: resultado.ruta || null,
          vendedor: resultado.vendedor || null,
          resultado: resultado.resultado,
          razon: resultado.razon,
          fotosRutas: fotosRutas
        });
        console.log('✓ Reporte guardado en MySQL');
      } catch (dbError) {
        console.error('⚠️  Error guardando en MySQL (continuando...):', dbError.message);
        // No interrumpir el proceso si falla MySQL
      }

      // 4. Guardar log de la solicitud
      await logSolicitud(resultado, req.ip);

      // 5. Determinar respuesta según resultado
      let responseData;

      if (resultado.resultado === "SI") {
        // CASO 1: Cliente puede ser inhabilitado
        responseData = {
          puedeInhabilitar: true,
          mensaje: "Cliente puede ser inhabilitado",
          codigo: codigoCliente,
          nombreCliente: resultado.nombreCliente,
          motivo: motivo,
          razon: resultado.razon,
          detalles: {
            zona: resultado.zona,
            ruta: resultado.ruta,
            vendedor: resultado.vendedor,
          },
        };

        console.log("✅ Solicitud APROBADA");
      } else if (resultado.resultado === "NO") {
        // CASO 2: Cliente NO puede ser inhabilitado
        responseData = {
          puedeInhabilitar: false,
          mensaje: "Cliente NO puede ser inhabilitado",
          codigo: codigoCliente,
          nombreCliente: resultado.nombreCliente,
          motivo: motivo,
          razon: resultado.razon,
        };

        console.log("❌ Solicitud RECHAZADA");
      } else {
        // CASO 3: Derivado a revisión manual
        responseData = {
          puedeInhabilitar: false,
          requiereRevisionManual: true,
          mensaje: "Solicitud derivada a revisión manual",
          codigo: codigoCliente,
          nombreCliente: resultado.nombreCliente,
          motivo: motivo,
          razon: resultado.razon,
          observacion: "Derivado a revisión manual con Inteligencia Comercial",
          instrucciones: [
            "1. La solicitud ha sido registrada en el sistema",
            "2. El caso será revisado por el equipo de Inteligencia Comercial",
            "3. Recibirás una respuesta en las próximas 24-48 horas",
            "4. Puedes consultar con tu supervisor para seguimiento",
          ],
        };

        console.log("⚠️  Solicitud DERIVADA A REVISIÓN MANUAL");
      }

      console.log("=".repeat(60) + "\n");

      // Responder al frontend
      res.status(200).json(responseData);
    } catch (error) {
      console.error("❌ Error procesando solicitud:", error);
      next(error);
    }
  }
);

/**
 * GET /api/bajas/estadisticas
 * Obtener estadísticas del día desde MySQL
 */
router.get("/estadisticas", async (req, res, next) => {
  try {
    // Obtener estadísticas de hoy desde MySQL
    const statsMySQL = await Reporte.getEstadisticasHoy();

    res.json({
      fecha: new Date().toISOString().split('T')[0],
      ...statsMySQL
    });
  } catch (error) {
    console.error("Error obteniendo estadísticas:", error);
    next(error);
  }
});

export default router;
