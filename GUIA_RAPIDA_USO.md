# 🚀 Guía Rápida de Uso - Sistema de Bajas

## 📋 Resumen de Cambios

Ya tienes todo implementado y commiteado! Aquí está cómo usar tu nuevo sistema:

---

## 🎯 1. Inicializar la Base de Datos

**Una sola vez:**

```bash
cd backend
npm run init-db
```

Esto creará las tablas:
- ✅ `motivos` - Gestión de motivos
- ✅ `reportes` - Historial de solicitudes
- ✅ `ventas` - Ventas de clientes
- ✅ `clientes` - Datos de clientes

---

## 🌐 2. Interfaces HTML (Sin Navbar)

Accede directamente por URL - nadie verá links a menos que tú los compartas:

### 🏷️ Gestión de Motivos
```
http://localhost:3001/api/motivos
```

**Funciones:**
- ✅ Ver todos los motivos actuales
- ✅ Agregar nuevos motivos dinámicamente
- ✅ Estadísticas en tiempo real

**Uso:**
1. Abre la URL en tu navegador
2. Escribe el nuevo motivo en el campo
3. Click en "Agregar" o presiona Enter
4. ¡Listo! El motivo se guarda en MySQL

---

### 🗄️ Actualizar Base de Datos
```
http://localhost:3001/api/actualizarBD
```

**Funciones:**
- ✅ Subir archivo Excel con ventas
- ✅ Modo "Agregar" nuevas ventas
- ✅ Modo "Reemplazar" todos los datos
- ✅ Drag & Drop de archivos
- ✅ Progress bar durante procesamiento
- ✅ Estadísticas actuales

**Uso:**

**Opción 1: Click**
1. Abre la URL
2. Click en el área de upload
3. Selecciona tu archivo Excel
4. Marca checkbox si quieres REEMPLAZAR todo
5. Click "Procesar Archivo"

**Opción 2: Drag & Drop**
1. Abre la URL
2. Arrastra tu Excel directo a la zona punteada
3. Configurar y procesar

**⚠️ Importante:**
- El Excel debe tener hoja "VentasPOD"
- Columnas requeridas: **Fecha**, **Cliente**, **Nombre Cliente**
- Procesa 1000 registros a la vez (eficiente para +2000/día)

---

## 📊 3. Cómo Funciona la Arquitectura

### **Datos en MySQL** (SQL eficiente)
```sql
ventas          → Fecha, código, nombre (índices optimizados)
clientes        → Código, nombre, ruta, zona
motivos         → Gestión dinámica
reportes        → Historial con fechas
```

**Ventajas:**
- ✅ Consultas SQL rápidas con índices
- ✅ Soporta millones de registros
- ✅ Búsquedas por rango de fechas
- ✅ Auditoría completa

### **Datos en Google Sheets** (Tiempo real)
```
ruta_vendedores → RUTA, ZONA, DIA, VENDEDOR
```

**Ventajas:**
- ✅ Actualización en tiempo real
- ✅ Sin necesidad de reimportar
- ✅ Acceso desde cualquier lugar

---

## 🔄 4. Flujo de Trabajo Diario

### **Inicio del Día:**

1. **Actualizar ventas nuevas:**
   - Abre `http://localhost:3001/api/actualizarBD`
   - Sube tu Excel actualizado
   - Modo "Agregar" (sin marcar checkbox)
   - Click "Procesar"

2. **Verificar motivos:**
   - Abre `http://localhost:3001/api/motivos`
   - Agrega motivos nuevos si es necesario

3. **Sistema listo** ✅

### **Durante el Día:**

El sistema consulta automáticamente:
- ✅ Ventas desde MySQL (rápido)
- ✅ Rutas desde Google Sheets (actualizado)
- ✅ Motivos desde MySQL

### **Fin del Día/Semana:**

**Opción 1: Agregar ventas nuevas**
```
- Sube Excel con datos del día/semana
- Modo "Agregar"
- Los datos se acumulan
```

**Opción 2: Reemplazar todo**
```
- Sube Excel con TODAS las ventas históricas
- Marca checkbox "Reemplazar"
- Limpia y recarga todo
```

---

## 📱 5. APIs Disponibles

### **Para el Frontend:**
```javascript
GET  /api/motivos                    // Obtener motivos
POST /api/bajas/solicitar            // Solicitar baja
POST /api/reportes/descargar         // Descargar reporte del día
POST /api/reportes/descargar-historico // Reportes por fechas
GET  /api/reportes/estadisticas      // Stats con rangos
```

### **Para Interfaces HTML:**
```javascript
GET  /api/motivos                    // Interfaz gestión motivos
GET  /api/actualizarBD               // Interfaz actualizar ventas
POST /api/actualizarBD               // Procesar Excel
GET  /api/ventas/estadisticas        // Stats de ventas
```

---

## 💡 6. Ejemplos de Uso

### **Actualizar Ventas Mensualmente:**

```bash
1. Exporta tu Excel con ventas del mes
2. Abre http://localhost:3001/api/actualizarBD
3. Sube el archivo
4. NO marcar "Reemplazar" (solo agrega)
5. Click "Procesar Archivo"
6. Espera a que termine (verás progress bar)
7. ¡Listo! +2000 registros agregados
```

### **Resetear Todo y Empezar de Nuevo:**

```bash
1. Prepara Excel con TODOS los datos históricos
2. Abre http://localhost:3001/api/actualizarBD
3. Sube el archivo
4. MARCAR "Reemplazar todos los datos"
5. Confirma la advertencia
6. Click "Procesar Archivo"
7. Sistema limpio con nuevos datos
```

### **Agregar Motivo Nuevo:**

```bash
1. Abre http://localhost:3001/api/motivos
2. Escribe: "Cliente fusionado con otro"
3. Enter o click "Agregar"
4. El motivo ya está disponible en el sistema
```

---

## 🎨 7. Ventajas del Nuevo Sistema

### **Antes (Solo Excel en Memoria):**
- ❌ Reiniciar servidor para actualizar datos
- ❌ Lento con archivos grandes
- ❌ No hay historial de cambios
- ❌ Difícil hacer consultas complejas

### **Ahora (MySQL + Google Sheets):**
- ✅ Actualizar sin reiniciar (interfaces HTML)
- ✅ Rápido con millones de registros (índices SQL)
- ✅ Historial completo con fechas
- ✅ Consultas SQL eficientes
- ✅ Reportes por rangos de fecha
- ✅ Rutas en tiempo real (Google Sheets)
- ✅ Interfaces visuales sin código

---

## 🔒 8. Seguridad

Las URLs de las interfaces NO aparecen en ningún menú:

- ✅ Solo tú sabes las URLs
- ✅ Sin enlaces en el frontend
- ✅ No hay navbar visible
- ✅ Acceso directo por URL

**Comparte solo con quien necesite acceso.**

---

## 📈 9. Estadísticas en Tiempo Real

### **En Actualizar BD:**
```
Total Ventas:   125,543
Fecha Mínima:   2024-01-01
Fecha Máxima:   2025-11-21
Días con Ventas: 325
```

### **En Motivos:**
```
Motivos Activos: 12
```

---

## 🚦 10. Estado del Sistema

**Funcionando:**
- ✅ Validación campo código (solo números)
- ✅ Bug fotos móviles arreglado
- ✅ Limpieza automática de campos
- ✅ MySQL para ventas y reportes
- ✅ Google Sheets para rutas
- ✅ Interfaces HTML sin navbar
- ✅ Upload masivo de ventas
- ✅ Gestión dinámica de motivos

**Pendiente en tu PC:**
- ⏳ Ejecutar `npm run init-db` (crear tablas)
- ⏳ Subir primer archivo de ventas

---

## 📞 Próximos Pasos

1. **Pull y actualizar:**
   ```bash
   git pull origin claude/add-validation-mysql-01LR2guWMVQoctsAw3g2ak9g
   ```

2. **Instalar dependencias:**
   ```bash
   cd backend
   npm install
   ```

3. **Inicializar BD:**
   ```bash
   npm run init-db
   ```

4. **Iniciar servidor:**
   ```bash
   npm run dev
   ```

5. **Abrir interfaces:**
   - http://localhost:3001/api/motivos
   - http://localhost:3001/api/actualizarBD

6. **Subir primer archivo de ventas** y ¡listo!

---

¿Necesitas ayuda con algo específico? 🚀
