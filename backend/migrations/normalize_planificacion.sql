-- Migración para normalizar la estructura de planificación de rutas
-- Separa en tablas: zonas, rutas, vendedores, dias, y una tabla de relación rutas_dias

-- ============================================================
-- PASO 0: Convertir colación de tabla existente
-- ============================================================

-- Convertir la tabla planificacion_rutas a utf8mb4_unicode_ci
ALTER TABLE planificacion_rutas CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================================
-- PASO 1: Crear nuevas tablas normalizadas
-- ============================================================

-- Tabla de Zonas
CREATE TABLE IF NOT EXISTS zonas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(50) UNIQUE NOT NULL COLLATE utf8mb4_unicode_ci,
  nombre VARCHAR(100) NOT NULL COLLATE utf8mb4_unicode_ci,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de Vendedores
CREATE TABLE IF NOT EXISTS vendedores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre_completo VARCHAR(150) NOT NULL COLLATE utf8mb4_unicode_ci,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  activo BOOLEAN DEFAULT TRUE,
  INDEX idx_nombre (nombre_completo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de Días
CREATE TABLE IF NOT EXISTS dias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(10) UNIQUE NOT NULL COLLATE utf8mb4_unicode_ci,
  nombre VARCHAR(20) NOT NULL COLLATE utf8mb4_unicode_ci,
  orden INT NOT NULL,
  INDEX idx_codigo (codigo),
  INDEX idx_orden (orden)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar días de la semana
INSERT INTO dias (codigo, nombre, orden) VALUES
('1-LU', 'Lunes', 1),
('2-MA', 'Martes', 2),
('3-MI', 'Miércoles', 3),
('4-JU', 'Jueves', 4),
('5-VI', 'Viernes', 5),
('6-SA', 'Sábado', 6)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), orden = VALUES(orden);

-- Tabla de Rutas
CREATE TABLE IF NOT EXISTS rutas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(100) UNIQUE NOT NULL COLLATE utf8mb4_unicode_ci,
  zona_id INT NOT NULL,
  vendedor_id INT NULL,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_codigo (codigo),
  INDEX idx_zona (zona_id),
  INDEX idx_vendedor (vendedor_id),
  FOREIGN KEY (zona_id) REFERENCES zonas(id) ON DELETE RESTRICT,
  FOREIGN KEY (vendedor_id) REFERENCES vendedores(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de relación Rutas-Días (muchos a muchos)
CREATE TABLE IF NOT EXISTS rutas_dias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ruta_id INT NOT NULL,
  dia_id INT NOT NULL,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_ruta_dia (ruta_id, dia_id),
  INDEX idx_ruta (ruta_id),
  INDEX idx_dia (dia_id),
  FOREIGN KEY (ruta_id) REFERENCES rutas(id) ON DELETE CASCADE,
  FOREIGN KEY (dia_id) REFERENCES dias(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PASO 2: Migrar datos de la tabla antigua (planificacion_rutas)
-- ============================================================

-- Insertar zonas únicas
INSERT INTO zonas (codigo, nombre)
SELECT DISTINCT
  zona as codigo,
  zona as nombre
FROM planificacion_rutas
WHERE zona IS NOT NULL AND zona != ''
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- Insertar vendedores únicos
INSERT INTO vendedores (nombre_completo)
SELECT DISTINCT vendedor
FROM planificacion_rutas
WHERE vendedor IS NOT NULL AND vendedor != ''
ON DUPLICATE KEY UPDATE nombre_completo = VALUES(nombre_completo);

-- Insertar rutas con sus zonas y vendedores
INSERT INTO rutas (codigo, zona_id, vendedor_id)
SELECT DISTINCT
  pr.ruta as codigo,
  z.id as zona_id,
  v.id as vendedor_id
FROM planificacion_rutas pr
INNER JOIN zonas z ON pr.zona = z.codigo
LEFT JOIN vendedores v ON pr.vendedor = v.nombre_completo
WHERE pr.ruta IS NOT NULL AND pr.ruta != ''
ON DUPLICATE KEY UPDATE
  zona_id = VALUES(zona_id),
  vendedor_id = VALUES(vendedor_id);

-- Insertar relaciones rutas-días
INSERT INTO rutas_dias (ruta_id, dia_id)
SELECT DISTINCT
  r.id as ruta_id,
  d.id as dia_id
FROM planificacion_rutas pr
INNER JOIN rutas r ON pr.ruta = r.codigo
INNER JOIN dias d ON pr.dia = d.codigo
WHERE pr.ruta IS NOT NULL AND pr.ruta != ''
  AND pr.dia IS NOT NULL AND pr.dia != ''
ON DUPLICATE KEY UPDATE ruta_id = VALUES(ruta_id);

-- ============================================================
-- PASO 3: Renombrar tabla antigua para backup
-- ============================================================

-- Renombrar la tabla antigua en lugar de eliminarla
RENAME TABLE planificacion_rutas TO planificacion_rutas_backup_old;

-- ============================================================
-- PASO 4: Crear vista para compatibilidad con código antiguo
-- ============================================================

-- Vista que simula la estructura antigua para compatibilidad
CREATE OR REPLACE VIEW planificacion_rutas AS
SELECT
  r.id,
  r.codigo as ruta,
  z.codigo as zona,
  d.codigo as dia,
  COALESCE(v.nombre_completo, '') as vendedor,
  r.fecha_actualizacion as fecha_sincronizacion
FROM rutas r
INNER JOIN zonas z ON r.zona_id = z.id
LEFT JOIN vendedores v ON r.vendedor_id = v.id
INNER JOIN rutas_dias rd ON r.id = rd.ruta_id
INNER JOIN dias d ON rd.dia_id = d.id
ORDER BY z.codigo, d.orden, r.codigo;

-- ============================================================
-- RESUMEN DE LA MIGRACIÓN
-- ============================================================

-- Verificar datos migrados
SELECT 'Zonas' as tabla, COUNT(*) as total FROM zonas
UNION ALL
SELECT 'Vendedores', COUNT(*) FROM vendedores
UNION ALL
SELECT 'Días', COUNT(*) FROM dias
UNION ALL
SELECT 'Rutas', COUNT(*) FROM rutas
UNION ALL
SELECT 'Rutas-Días (relaciones)', COUNT(*) FROM rutas_dias
UNION ALL
SELECT 'Vista planificacion_rutas', COUNT(*) FROM planificacion_rutas;
