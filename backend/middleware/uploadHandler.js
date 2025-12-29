import { upload, handleMulterError } from "../config/multer.js";
import { compressImages } from "./imageCompression.js";

// Middleware para manejar upload de fotos
export const uploadPhotos = (req, res, next) => {
  // Usar multer para procesar los archivos
  const uploadMiddleware = upload.array("fotos", parseInt(process.env.MAX_FILES) || 5);

  uploadMiddleware(req, res, async (err) => {
    // Si hay error de multer, manejarlo
    if (err) {
      return handleMulterError(err, req, res, next);
    }

    // Validar que se hayan subido fotos
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: "Debes subir al menos una foto",
      });
    }

    // Log de archivos subidos
    console.log(`📸 ${req.files.length} foto(s) subida(s) por ${req.body.codigoCliente || "desconocido"}`);

    // Agregar info de archivos al request (antes de comprimir)
    req.uploadedFiles = req.files.map((file) => ({
      filename: file.filename,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype,
    }));

    // Comprimir imágenes antes de continuar
    await compressImages(req, res, next);
  });
};

// Middleware para limpiar archivos en caso de error
export const cleanupUploads = (req, res, next) => {
  // Guardar la función original de res.json
  const originalJson = res.json.bind(res);

  // Override de res.json
  res.json = function (data) {
    // Si hay error y hay archivos subidos, eliminarlos
    if (res.statusCode >= 400 && req.files) {
      const fs = require("fs");
      req.files.forEach((file) => {
        try {
          fs.unlinkSync(file.path);
          console.log(`🗑️  Archivo eliminado por error: ${file.filename}`);
        } catch (err) {
          console.error(`❌ Error eliminando archivo: ${err.message}`);
        }
      });
    }

    // Llamar a la función original
    return originalJson(data);
  };

  next();
};
