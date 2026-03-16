-- Migración: Agregar columnas para control de inhabilitación de clientes
-- Fecha: 2026-03-13
-- Descripción: Agrega columnas para rastrear si un cliente aprobado ya fue inhabilitado en Dualpoint

-- Agregar columna para marcar si el cliente ya fue inhabilitado
ALTER TABLE reportes
ADD COLUMN IF NOT EXISTS inhabilitado_dualpoint TINYINT(1) DEFAULT 0
COMMENT 'Indica si el cliente ya fue movido a ruta genérica en Dualpoint (0=No, 1=Sí)';

-- Agregar columna para registrar la fecha de inhabilitación
ALTER TABLE reportes
ADD COLUMN IF NOT EXISTS fecha_inhabilitacion DATETIME NULL
COMMENT 'Fecha y hora en que el cliente fue inhabilitado en Dualpoint';

-- Crear índice para mejorar consultas de clientes pendientes de inhabilitar
CREATE INDEX IF NOT EXISTS idx_inhabilitacion
ON reportes(estado_aprobacion, inhabilitado_dualpoint, fecha_aprobacion);

-- Verificar las columnas agregadas
DESCRIBE reportes;

-- Mostrar cuántos clientes están pendientes de inhabilitar
SELECT
    COUNT(*) as clientes_pendientes
FROM reportes
WHERE estado_aprobacion = 'APROBADO'
    AND (inhabilitado_dualpoint IS NULL OR inhabilitado_dualpoint = 0);
