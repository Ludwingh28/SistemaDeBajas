// Middleware de manejo centralizado de errores
export const errorHandler = (err, req, res, next) => {
  // Log del error en servidor
  console.error("❌ Error capturado:", {
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Si ya se envió una respuesta, delegar a Express
  if (res.headersSent) {
    return next(err);
  }

  // Determinar código de estado
  const statusCode = err.statusCode || err.status || 500;

  // Respuesta al cliente
  res.status(statusCode).json({
    error: err.message || "Error interno del servidor",
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
      details: err.details,
    }),
  });
};

// Middleware para rutas no encontradas
export const notFoundHandler = (req, res, next) => {
  const error = new Error(`Ruta no encontrada: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};
// Helper para crear errores personalizados
export class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Export por defecto para compatibilidad
export default { errorHandler, notFoundHandler, AppError };
