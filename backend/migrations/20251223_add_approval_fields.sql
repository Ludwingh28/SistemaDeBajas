-- Migración: Agregar campos para aprobación manual de solicitudes
-- Fecha: 2025-12-23
-- Descripción: Agrega campos para registrar quién aprobó/rechazó solicitudes MANUAL

ALTER TABLE reportes
ADD COLUMN supervisor_aprobador VARCHAR(255) NULL COMMENT 'Nombre del supervisor que aprobó/rechazó',
ADD COLUMN fecha_aprobacion DATETIME NULL COMMENT 'Fecha y hora de aprobación/rechazo',
ADD COLUMN comentario_aprobacion TEXT NULL COMMENT 'Comentario opcional del supervisor',
ADD COLUMN estado_aprobacion ENUM('PENDIENTE', 'APROBADO', 'RECHAZADO') DEFAULT 'PENDIENTE' COMMENT 'Estado de la solicitud manual';

-- Índice para búsquedas rápidas de solicitudes pendientes
CREATE INDEX idx_estado_aprobacion ON reportes(estado_aprobacion, resultado);

-- Comentario de tabla
ALTER TABLE reportes COMMENT = 'Histórico de solicitudes de inhabilitación con aprobaciones manuales';
