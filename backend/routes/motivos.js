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

    // Retornar objetos completos con id, nombre y activo
    res.json({
      motivos: motivos,
      total: motivos.length,
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

/**
 * PUT /api/motivos/:id
 * Actualizar nombre de un motivo
 */
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre } = req.body;

    if (!nombre || nombre.trim().length === 0) {
      return res.status(400).json({
        error: "El nombre del motivo no puede estar vacío",
      });
    }

    // Actualizar motivo
    await Motivo.update(parseInt(id), nombre.trim());

    res.json({
      message: "Motivo actualizado exitosamente",
      motivo: nombre.trim(),
    });
  } catch (error) {
    console.error("❌ Error actualizando motivo:", error);

    if (error.message === "El motivo ya existe") {
      return res.status(400).json({
        error: "Ya existe un motivo con ese nombre",
      });
    }

    next(error);
  }
});

/**
 * PATCH /api/motivos/:id/desactivar
 * Desactivar (inhabilitar) un motivo
 */
router.patch("/:id/desactivar", async (req, res, next) => {
  try {
    const { id } = req.params;

    await Motivo.deactivate(parseInt(id));

    res.json({
      message: "Motivo desactivado exitosamente",
    });
  } catch (error) {
    console.error("❌ Error desactivando motivo:", error);
    next(error);
  }
});

/**
 * PATCH /api/motivos/:id/activar
 * Activar un motivo previamente desactivado
 */
router.patch("/:id/activar", async (req, res, next) => {
  try {
    const { id } = req.params;

    await Motivo.activate(parseInt(id));

    res.json({
      message: "Motivo activado exitosamente",
    });
  } catch (error) {
    console.error("❌ Error activando motivo:", error);
    next(error);
  }
});

export default router;
