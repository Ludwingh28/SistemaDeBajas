import { body, validationResult } from 'express-validator';

/**
 * Middleware de sanitización para prevenir ataques XSS
 * Escapa caracteres HTML peligrosos en todos los inputs del usuario
 */

/**
 * Función personalizada para sanitizar texto
 * - Remueve scripts, eventos HTML y tags peligrosos
 * - Mantiene texto normal y números
 */
const sanitizeText = (value) => {
  if (typeof value !== 'string') return value;

  return value
    .trim()
    // Remover scripts
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remover event handlers (onclick, onerror, etc)
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*[^\s>]*/gi, '')
    // Remover javascript: URLs
    .replace(/javascript:/gi, '')
    // Escapar HTML básico
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Sanitiza campos de texto comunes
 */
export const sanitizeTextFields = [
  body('*.nombre').customSanitizer(sanitizeText),
  body('*.razon').customSanitizer(sanitizeText),
  body('*.vendedor').customSanitizer(sanitizeText),
  body('*.zona').customSanitizer(sanitizeText),
  body('*.ruta').customSanitizer(sanitizeText),
  body('*.motivo').customSanitizer(sanitizeText),
  body('*.resultado').customSanitizer(sanitizeText),
  body('codigoCliente').customSanitizer(sanitizeText),
  body('nombreCliente').customSanitizer(sanitizeText),
  body('comentario_aprobacion').optional().customSanitizer(sanitizeText),
];

/**
 * Maneja errores de validación
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Datos inválidos',
      errors: errors.array()
    });
  }
  next();
};

export default {
  sanitizeTextFields,
  handleValidationErrors
};
