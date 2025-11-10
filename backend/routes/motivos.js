import express from "express";
import { getCachedMotivos } from "../services/excelReader.js";

const router = express.Router();

/**
 * GET /api/motivos
 * Obtener lista de motivos disponibles
 */
router.get("/", (req, res, next) => {
  try {
    const motivos = getCachedMotivos();

    if (!motivos || motivos.length === 0) {
      return res.status(500).json({
        error: "No se pudieron cargar los motivos",
      });
    }

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
 * POST /api/motivos/agregar (Opcional - para administradores)
 * Agregar un nuevo motivo dinámicamente
 */
router.post("/agregar", async (req, res, next) => {
  try {
    const { motivo } = req.body;

    if (!motivo || motivo.trim().length === 0) {
      return res.status(400).json({
        error: "El motivo no puede estar vacío",
      });
    }

    const { paths } = await import("../config/database.js");
    const fs = await import("fs/promises");

    // Leer archivo actual
    const content = await fs.readFile(paths.motivosFile, "utf-8");
    const motivosActuales = content
      .split("\n")
      .map((m) => m.trim())
      .filter((m) => m.length > 0);

    // Verificar si ya existe
    if (motivosActuales.includes(motivo.trim())) {
      return res.status(400).json({
        error: "Este motivo ya existe",
      });
    }

    // Agregar nuevo motivo
    motivosActuales.push(motivo.trim());

    // Guardar archivo
    await fs.writeFile(paths.motivosFile, motivosActuales.join("\n"), "utf-8");

    // Refrescar cache
    const { refreshCache } = await import("../services/excelReader.js");
    await refreshCache();

    res.json({
      message: "Motivo agregado exitosamente",
      motivo: motivo.trim(),
      totalMotivos: motivosActuales.length,
    });
  } catch (error) {
    console.error("❌ Error agregando motivo:", error);
    next(error);
  }
});

export default router;
