# Guía de Despliegue a Producción - Sistema de Bajas

## 📋 Cambios en esta actualización

### Backend:
- ✅ Filtro de fechas en endpoint de solicitudes pendientes
- ✅ Nuevo método `getPendingManualApprovalsByDateRange` en modelo Reporte
- ✅ Endpoint `/api/reportes/ver-historico` para visualización de reportes
- ✅ Servir archivos estáticos desde `/uploads`

### Frontend:
- ✅ Componente `VisualizarReportes.jsx` (nuevo)
- ✅ Mejoras en `AprobarSolicitudes.jsx` con filtro de fechas
- ✅ Correcciones en carga de imágenes con loading states
- ✅ Mejoras en modales y UX

---

## 🔄 Pasos para Desplegar

### **PASO 1: Hacer Backup (MUY IMPORTANTE)**

#### 1.1 Backup de la Base de Datos
```bash
# Conectarse al servidor MySQL
mysql -u root -p

# Dentro de MySQL, crear backup
mysqldump -u root -p sistema_bajas > backup_sistema_bajas_YYYYMMDD.sql

# O desde la terminal directamente:
mysqldump -u root -p sistema_bajas > "C:\backups\sistema_bajas_20251229.sql"
```

#### 1.2 Backup de Archivos
```bash
# Crear carpeta de backup
mkdir C:\backups\sistema_bajas_20251229

# Copiar toda la carpeta del proyecto
xcopy "C:\ruta\a\tu\SistemaDeBajas" "C:\backups\sistema_bajas_20251229" /E /I /H
```

---

### **PASO 2: Detener el Sistema**

```bash
# Si tienes el script de detener sistema:
cd C:\ruta\a\tu\SistemaDeBajas
.\detener-sistema.bat

# O manualmente:
# 1. Detener el backend (Ctrl+C en la terminal del backend)
# 2. Detener el frontend (Ctrl+C en la terminal del frontend)
```

---

### **PASO 3: Actualizar el Código**

#### 3.1 Si usas Git:
```bash
cd C:\ruta\a\tu\SistemaDeBajas

# Ver qué archivos cambiaron
git status

# Hacer commit de cambios locales (si los hay)
git add .
git commit -m "Cambios antes de actualización"

# Traer los cambios nuevos
git pull origin main
```

#### 3.2 Si NO usas Git:
Copia manualmente estos archivos desde tu PC de desarrollo al servidor:

**Backend:**
```
backend/models/Reporte.js
backend/routes/reportes.js
backend/index.js (verificar que tenga app.use("/uploads", express.static("uploads")))
```

**Frontend:**
```
frontend/src/components/AprobarSolicitudes.jsx
frontend/src/components/VisualizarReportes.jsx (NUEVO)
frontend/src/components/AdminDashboard.jsx
frontend/src/components/DescargarReportes.jsx
```

---

### **PASO 4: Instalar Dependencias (si hay nuevas)**

```bash
# Backend
cd backend
npm install

# Frontend
cd ..\frontend
npm install
```

---

### **PASO 5: Verificar Configuración**

#### 5.1 Verificar que el backend sirva archivos estáticos
Abrir `backend/index.js` y verificar que tenga esta línea:

```javascript
// Servir archivos estáticos (uploads de fotos)
app.use("/uploads", express.static("uploads"));
```

Si no la tiene, agregarla **ANTES** de las rutas.

#### 5.2 Verificar variables de entorno
```bash
# Verificar que backend/.env tenga:
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=tu_password
MYSQL_DATABASE=sistema_bajas
PORT=3001
```

---

### **PASO 6: Construir Frontend para Producción**

```bash
cd frontend
npm run build
```

Este comando creará una carpeta `dist` con los archivos optimizados.

---

### **PASO 7: Configurar Servidor Web (si aplica)**

Si estás usando un servidor web como **Apache** o **Nginx**, asegúrate de que:

#### Para Apache:
```apache
# Agregar al VirtualHost
Alias /uploads "C:/ruta/a/tu/SistemaDeBajas/backend/uploads"
<Directory "C:/ruta/a/tu/SistemaDeBajas/backend/uploads">
    Require all granted
    Options -Indexes
</Directory>
```

#### Para desarrollo (Vite):
No necesitas hacer nada, Vite ya está configurado en `vite.config.js` con el proxy.

---

### **PASO 8: Iniciar el Sistema**

```bash
cd C:\ruta\a\tu\SistemaDeBajas

# Si tienes el script de reinicio:
.\reiniciar-sistema.bat

# O manualmente:
# Terminal 1 - Backend:
cd backend
npm start

# Terminal 2 - Frontend (desarrollo):
cd frontend
npm run dev
```

---

### **PASO 9: Verificar que Todo Funciona**

#### 9.1 Verificar Backend
Abrir en navegador: `http://localhost:3001/health` (debería responder OK)

#### 9.2 Verificar Frontend
Abrir: `http://localhost:5173` (o el puerto que uses)

#### 9.3 Probar Funcionalidades Nuevas:
1. ✅ **Login** - Ingresar con código de supervisor
2. ✅ **Aprobar Solicitudes** - Verificar que aparezca el filtro de fechas
3. ✅ **Visualizar Reportes** - Probar el nuevo módulo
4. ✅ **Ver Fotos** - Verificar que las imágenes carguen correctamente
5. ✅ **Descargar Reportes** - Verificar descarga de Excel

---

### **PASO 10: Monitoreo Post-Despliegue**

#### 10.1 Revisar Logs del Backend
```bash
# Ver logs en tiempo real (si usas PM2):
pm2 logs sistema-bajas-backend

# O revisar archivo de logs si los tienes configurados
```

#### 10.2 Revisar Errores en Navegador
- Abrir DevTools (F12)
- Ver consola para errores JavaScript
- Ver Network para errores de red/API

---

## 🚨 Plan de Rollback (Si algo sale mal)

### Opción 1: Restaurar Base de Datos
```bash
mysql -u root -p sistema_bajas < "C:\backups\sistema_bajas_20251229.sql"
```

### Opción 2: Restaurar Archivos
```bash
# Detener el sistema
.\detener-sistema.bat

# Restaurar desde backup
xcopy "C:\backups\sistema_bajas_20251229" "C:\ruta\a\tu\SistemaDeBajas" /E /I /H /Y

# Reiniciar
.\reiniciar-sistema.bat
```

### Opción 3: Revertir con Git
```bash
# Ver commits recientes
git log --oneline -5

# Volver al commit anterior
git reset --hard HEAD~1

# O volver a un commit específico
git reset --hard <commit-hash>

# Reinstalar dependencias y reiniciar
cd backend && npm install
cd ..\frontend && npm install
.\reiniciar-sistema.bat
```

---

## 📝 Checklist de Verificación

Marca cada item después de verificarlo:

### Antes del Despliegue:
- [ ] Backup de base de datos creado
- [ ] Backup de archivos creado
- [ ] Sistema detenido correctamente
- [ ] Todos los archivos actualizados

### Durante el Despliegue:
- [ ] Dependencias instaladas (npm install)
- [ ] Frontend construido (npm run build)
- [ ] Configuración verificada (.env)
- [ ] Archivos estáticos configurados

### Después del Despliegue:
- [ ] Backend respondiendo correctamente
- [ ] Frontend cargando sin errores
- [ ] Login funciona
- [ ] Módulo "Aprobar Solicitudes" funciona
- [ ] Módulo "Visualizar Reportes" funciona
- [ ] Filtro de fechas funciona
- [ ] Imágenes cargan correctamente
- [ ] Descargar reportes funciona

---

## 🆘 Contactos de Soporte

**Desarrollador:** [Tu contacto]
**Servidor:** [IP/Dominio del servidor]
**Base de Datos:** MySQL en localhost:3306

---

## 📚 Notas Adicionales

### Arquitectura del Sistema:
- **Backend:** Node.js + Express en puerto 3001
- **Frontend:** React + Vite en puerto 5173 (desarrollo) o servido por Apache/Nginx (producción)
- **Base de Datos:** MySQL (sistema_bajas)
- **Archivos:** uploads/ para fotos de evidencia

### Próximas Actualizaciones Planeadas:
- Sistema de roles y permisos
- Gestión de usuarios supervisores
- Cambio obligatorio de contraseña al primer login

---

**Fecha de Creación:** 29 de Diciembre 2025
**Versión del Sistema:** 1.2.0
**Última Actualización:** Sistema de filtros de fecha y visualización de reportes
