import multer from "multer";
import path from "path";
import { paths } from "./database.js";
import fs from "fs";

// Crear carpeta uploads si no existe
if (!fs.existsSync(paths.uploads)) {
  fs.mkdirSync(paths.uploads, { recursive: true });
}

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, paths.uploads);
  },
  filename: (req, file, cb) => {
    // Nombre único: timestamp-codigo-cliente-original.ext
    const codigoCliente = req.body.codigoCliente || "unknown";
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${codigoCliente}-${uniqueSuffix}${ext}`);
  },
});

// Filtro de archivos - Solo imágenes
const fileFilter = (req, file, cb) => {
  const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Solo se permiten archivos de imagen (JPG, PNG, GIF, WEBP)"), false);
  }
};

// Configuración de Multer
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB por defecto
    files: parseInt(process.env.MAX_FILES) || 5, // 5 archivos máximo
  },
});

// Middleware de manejo de errores de Multer
export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: "El archivo es demasiado grande. Máximo 5MB por foto.",
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        error: "Demasiados archivos. Máximo 5 fotos.",
      });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        error: "Campo de archivo inesperado.",
      });
    }
    return res.status(400).json({
      error: `Error de upload: ${err.message}`,
    });
  }

  if (err) {
    return res.status(400).json({
      error: err.message,
    });
  }

  next();
};
