import Supervisor from "../models/Supervisor.js";
import { AppError } from "./errorHandler.js";

// Middleware para verificar código de supervisor (usando BD)
export const authenticateSupervisor = async (req, res, next) => {
  try {
    // Intentar obtener el código del header, body o query
    const codigoSupervisor =
      req.headers['x-supervisor-code'] ||
      req.body?.codigoSupervisor ||
      req.query?.codigoSupervisor;

    // Validar que venga el código
    if (!codigoSupervisor) {
      throw new AppError("Código de supervisor requerido", 401);
    }

    // Verificar el código contra todos los supervisores activos
    const resultado = await Supervisor.verificarCodigoSolo(codigoSupervisor);

    if (!resultado.valido) {
      // Log de intento fallido
      console.warn("⚠️  Intento de acceso con código inválido:", {
        ip: req.ip,
        timestamp: new Date().toISOString(),
        razon: resultado.mensaje
      });

      throw new AppError(resultado.mensaje || "Código de supervisor inválido", 403);
    }

    // Log de acceso exitoso
    console.log("✅ Supervisor autenticado:", {
      nombre: resultado.supervisor.nombre,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });

    // Agregar info del supervisor al request
    req.supervisor = resultado.supervisor;
    req.supervisorNombre = resultado.supervisor.nombre;

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
