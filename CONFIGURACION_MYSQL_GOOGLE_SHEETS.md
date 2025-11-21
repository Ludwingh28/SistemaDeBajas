# Configuración MySQL y Google Sheets

## 📋 Cambios Implementados

### ✅ Frontend
1. **Campo código**: Ahora solo acepta números
2. **Botón eliminar fotos**: Visible en móviles (arreglado el bug)
3. **Limpieza automática**: Todos los campos se limpian después de enviar

### ✅ Backend
1. **MySQL**: Sistema migrado para usar base de datos
   - Tabla `motivos`: Gestión dinámica de motivos
   - Tabla `reportes`: Historial completo de solicitudes
2. **Google Sheets**: Lectura automática de "ruta vendedores"
3. **Nuevos endpoints**:
   - `POST /api/reportes/descargar-historico`: Descargar reportes por rango de fechas
   - `GET /api/reportes/estadisticas?fechaInicio=...&fechaFin=...`: Estadísticas por rango

---

## 🚀 Guía de Configuración

### 1. Instalar Dependencias

```bash
cd backend
npm install
```

Esto instalará las nuevas dependencias:
- `mysql2`: Conector MySQL
- `axios`: Para consumir Google Sheets
- `csv-parse`: Parser de CSV

---

### 2. Configurar MySQL

#### 2.1 Crear archivo `.env`

Copia el archivo de ejemplo y configúralo:

```bash
cp .env.example .env
```

#### 2.2 Editar `.env` con tus credenciales MySQL

```env
# MySQL Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
DB_NAME=sistema_bajas
```

#### 2.3 Inicializar Base de Datos

El script automáticamente:
- Crea la base de datos `sistema_bajas`
- Crea las tablas `motivos` y `reportes`
- Inserta los 10 motivos iniciales

**Ejecutar:**

```bash
npm run init-db
```

**Salida esperada:**
```
🔧 Iniciando configuración de base de datos...

✓ Conectado a MySQL
✓ Base de datos 'sistema_bajas' lista
✓ Tabla "motivos" creada
✓ Tabla "reportes" creada

📝 Insertando motivos iniciales...
✓ 10 motivos insertados

📋 Motivos en la base de datos:
   1. Cierre Definitivo ✓
   2. Cambio de rubro ✓
   ...

✅ ¡Base de datos inicializada correctamente!
```

---

### 3. Configurar Google Sheets

#### 3.1 Hacer tu Google Sheet público

1. Abre tu Google Sheet con los datos de "ruta vendedores"
2. Click en **Compartir** → **Cambiar a cualquier persona con el enlace**
3. Asegúrate que esté en modo **Visualizador**
4. Copia la URL completa

**Ejemplo de URL:**
```
https://docs.google.com/spreadsheets/d/1ABC123xyz.../edit#gid=0
```

#### 3.2 Agregar URL al `.env`

```env
# Google Sheets Configuration
GOOGLE_SHEET_URL=https://docs.google.com/spreadsheets/d/1ABC123xyz.../edit#gid=0
```

**IMPORTANTE:** El sistema usará Google Sheets automáticamente si está configurado, o usará el Excel local como fallback.

---

### 4. Estructura de la Hoja de Google Sheets

Tu Google Sheet debe tener estas columnas (primera fila):

| RUTA | ZONA | DIA | VENDEDOR |
|------|------|-----|----------|
| 101  | NORTE | LUNES | Juan Pérez |
| 102  | SUR | MARTES | María García |
| ...  | ...  | ...   | ... |

**Notas:**
- Los nombres de columnas pueden estar en mayúsculas o minúsculas
- El sistema normaliza automáticamente los nombres

---

## 🎯 Nuevas Funcionalidades

### 1. Gestión de Motivos

#### Ver motivos
```bash
GET /api/motivos
```

**Respuesta:**
```json
{
  "motivos": [
    "Cierre Definitivo",
    "Cambio de rubro",
    ...
  ],
  "total": 10
}
```

#### Agregar motivo
```bash
POST /api/motivos/agregar
Content-Type: application/json

{
  "motivo": "Nuevo Motivo"
}
```

**Respuesta:**
```json
{
  "message": "Motivo agregado exitosamente",
  "motivo": "Nuevo Motivo",
  "totalMotivos": 11
}
```

---

### 2. Reportes Históricos

#### Descargar reportes por rango de fechas

```bash
POST /api/reportes/descargar-historico
Content-Type: application/json

{
  "codigoSupervisor": "tu_codigo",
  "fechaInicio": "2025-01-01",
  "fechaFin": "2025-01-31"
}
```

**Respuesta:** Archivo Excel con todos los reportes del rango

**Nombre del archivo:** `reporte_historico_2025-01-01_a_2025-01-31.xlsx`

**Columnas del Excel:**
- Fecha Solicitud
- Código Cliente
- Nombre Cliente
- Motivo
- Zona
- Ruta
- Vendedor
- Resultado
- Razón

---

### 3. Estadísticas por Rango

```bash
GET /api/reportes/estadisticas?fechaInicio=2025-01-01&fechaFin=2025-01-31
```

**Respuesta:**
```json
{
  "total": 150,
  "aprobados": 120,
  "rechazados": 20,
  "manuales": 10,
  "rango": {
    "fechaInicio": "2025-01-01",
    "fechaFin": "2025-01-31"
  }
}
```

---

## 🔧 Iniciar el Sistema

### Desarrollo

```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

### Producción

```bash
# Backend
cd backend
npm start

# Frontend
cd frontend
npm run build
npm run preview
```

---

## 📊 Estructura de Base de Datos

### Tabla `motivos`

```sql
CREATE TABLE motivos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL UNIQUE,
  activo BOOLEAN DEFAULT TRUE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Tabla `reportes`

```sql
CREATE TABLE reportes (
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
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## ⚠️ Troubleshooting

### Error: "Cannot connect to MySQL"

**Solución:**
1. Verifica que MySQL esté corriendo: `sudo service mysql status`
2. Verifica credenciales en `.env`
3. Prueba conexión: `mysql -u usuario -p`

### Error: "URL de Google Sheets inválida"

**Solución:**
1. Verifica que la URL sea completa
2. Asegúrate que contenga `/spreadsheets/d/`
3. Verifica que la hoja sea pública

### Sistema usa Excel en lugar de Google Sheets

**Causa:** Google Sheets no está configurado o falló la carga

**Solución:**
1. Verifica `GOOGLE_SHEET_URL` en `.env`
2. Revisa logs del servidor al iniciar
3. El sistema automáticamente usa Excel como fallback (esto es normal)

---

## 📝 Notas Importantes

1. **MySQL es opcional**: El sistema funciona sin MySQL, pero no guardará históricos
2. **Google Sheets es opcional**: El sistema usa Excel local como fallback
3. **Reportes históricos**: Solo funcionan si MySQL está configurado
4. **Motivos dinámicos**: Requieren MySQL para agregar nuevos motivos
5. **Excel local**: Siempre se usa para ventas y clientes (nuevito.xlsx)

---

## 🎉 ¡Listo!

Tu sistema ahora tiene:
- ✅ Validación de solo números en código
- ✅ Bug de fotos en móviles arreglado
- ✅ Limpieza automática de campos
- ✅ MySQL para motivos y reportes
- ✅ Google Sheets para rutas vendedores
- ✅ Descarga de reportes por rango de fechas
- ✅ Estadísticas históricas

**¿Preguntas?** Revisa los logs del servidor para más detalles.
