import rateLimit from "express-rate-limit";

// Rate limiter general para todas las rutas
export const generalLimiter = rateLimit({
  windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW) || 15) * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests por ventana
  message: {
    error: "Demasiadas peticiones desde esta IP, por favor intenta de nuevo más tarde.",
  },
  standardHeaders: true, // Incluir headers RateLimit-*
  legacyHeaders: false, // Desactivar headers X-RateLimit-*
  handler: (req, res) => {
    res.status(429).json({
      error: "Demasiadas peticiones. Por favor intenta de nuevo más tarde.",
      retryAfter: req.rateLimit.resetTime,
    });
  },
});

// Rate limiter estricto para solicitudes de baja
export const bajasLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 10, // 10 solicitudes por IP cada 5 minutos
  message: {
    error: "Has excedido el límite de solicitudes de baja. Espera unos minutos.",
  },
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    res.status(429).json({
      error: "Demasiadas solicitudes de baja. Por favor espera unos minutos.",
      retryAfter: Math.ceil(req.rateLimit.resetTime.getTime() / 1000),
    });
  },
});

// Rate limiter para descargas de reportes
export const reportesLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 5, // 5 descargas cada 10 minutos
  message: {
    error: "Límite de descargas excedido. Intenta más tarde.",
  },
  handler: (req, res) => {
    res.status(429).json({
      error: "Demasiadas descargas de reportes. Intenta más tarde.",
    });
  },
});
