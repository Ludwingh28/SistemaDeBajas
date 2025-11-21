import express from "express";
import Motivo from "../models/Motivo.js";

const router = express.Router();

/**
 * GET /api/motivos
 * Obtener lista de motivos disponibles desde MySQL
 */
router.get("/", async (req, res, next) => {
  try {
    const motivos = await Motivo.getAll();

    if (!motivos || motivos.length === 0) {
      return res.status(500).json({
        error: "No se pudieron cargar los motivos",
      });
    }

    // Retornar solo los nombres de motivos (formato compatible con el frontend)
    const nombresMotivos = motivos.map(m => m.nombre);

    res.json({
      motivos: nombresMotivos,
      total: nombresMotivos.length,
    });
  } catch (error) {
    console.error("❌ Error obteniendo motivos:", error);
    next(error);
  }
});

/**
 * POST /api/motivos/agregar
 * Agregar un nuevo motivo a la base de datos
 */
router.post("/agregar", async (req, res, next) => {
  try {
    const { motivo } = req.body;

    if (!motivo || motivo.trim().length === 0) {
      return res.status(400).json({
        error: "El motivo no puede estar vacío",
      });
    }

    // Verificar si ya existe
    const existe = await Motivo.existsByName(motivo.trim());
    if (existe) {
      return res.status(400).json({
        error: "Este motivo ya existe",
      });
    }

    // Crear nuevo motivo
    const nuevoMotivo = await Motivo.create(motivo.trim());

    // Obtener total de motivos
    const todosMotivos = await Motivo.getAll();

    res.json({
      message: "Motivo agregado exitosamente",
      motivo: nuevoMotivo.nombre,
      totalMotivos: todosMotivos.length,
    });
  } catch (error) {
    console.error("❌ Error agregando motivo:", error);

    if (error.message === "El motivo ya existe") {
      return res.status(400).json({
        error: error.message,
      });
    }

    next(error);
  }
});

export default router;
