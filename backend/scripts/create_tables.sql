-- Script para crear las tablas del Sistema de Bajas
-- Base de datos: sistema_bajas

-- Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS sistema_bajas
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE sistema_bajas;

-- Tabla de motivos
CREATE TABLE IF NOT EXISTS motivos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL UNIQUE,
  activo BOOLEAN DEFAULT TRUE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_activo (activo),
  INDEX idx_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de reportes (historial de solicitudes de baja)
CREATE TABLE IF NOT EXISTS reportes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo_cliente VARCHAR(50) NOT NULL,
  nombre_cliente VARCHAR(255) NOT NULL,
  motivo VARCHAR(255) NOT NULL,
  zona VARCHAR(100),
  ruta VARCHAR(100),
  vendedor VARCHAR(255),
  resultado ENUM('SI', 'NO', 'MANUAL') NOT NULL,
  razon TEXT,
  fotos_rutas JSON,
  fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_fecha_solicitud (fecha_solicitud),
  INDEX idx_codigo_cliente (codigo_cliente),
  INDEX idx_resultado (resultado),
  INDEX idx_fecha_creacion (fecha_creacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar motivos iniciales desde motivos.txt
INSERT INTO motivos (nombre) VALUES
  ('Cierre Definitivo'),
  ('Cambio de rubro'),
  ('Cambio de Dueño'),
  ('Duplicado'),
  ('Mal punteado'),
  ('Mudanza'),
  ('No hay negocio'),
  ('No hay negocio con ese nombre'),
  ('Tienda en Alquiler'),
  ('Otro')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- Mostrar las tablas creadas
SHOW TABLES;

-- Verificar los motivos insertados
SELECT * FROM motivos;
