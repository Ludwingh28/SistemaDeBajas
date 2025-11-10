import { verifySupervisorCode } from "../config/supervisores.js";
import { AppError } from "./errorHandler.js";

// Middleware para verificar código de supervisor
export const authenticateSupervisor = async (req, res, next) => {
  try {
    const { codigoSupervisor } = req.body;

    // Validar que venga el código
    if (!codigoSupervisor) {
      throw new AppError("Código de supervisor requerido", 400);
    }

    // Verificar el código
    const isValid = await verifySupervisorCode(codigoSupervisor);

    if (!isValid) {
      // Log de intento fallido
      console.warn("⚠️  Intento de acceso con código inválido:", {
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });

      throw new AppError("Código de supervisor inválido", 403);
    }

    // Log de acceso exitoso
    console.log("✅ Supervisor autenticado:", {
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });

    // Continuar con la petición
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware para validar que vengan los campos requeridos
export const validateRequiredFields = (fields) => {
  return (req, res, next) => {
    const missingFields = [];

    for (const field of fields) {
      if (!req.body[field] && !req.files?.[field]) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      return next(new AppError(`Campos requeridos faltantes: ${missingFields.join(", ")}`, 400));
    }

    next();
  };
};
