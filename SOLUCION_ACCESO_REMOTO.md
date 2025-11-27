# Solución: Acceso Remoto y PM2 en Windows

## ✅ Problema Resuelto: Motivos No Cargan desde Otros Dispositivos

### Causa del Problema
Los componentes del frontend tenían URLs hardcodeadas como `http://localhost:3001/api/...` en lugar de usar rutas relativas. Cuando accedías desde otro dispositivo (ej: 192.168.1.100), el navegador intentaba conectarse al `localhost` del dispositivo cliente, no del servidor.

### Solución Aplicada

**1. Se actualizaron TODOS los componentes para usar rutas relativas:**

Los siguientes archivos fueron modificados para usar `/api/...` en lugar de `http://localhost:3001/api/...`:

- ✅ `frontend/src/components/GestionMotivos.jsx`
- ✅ `frontend/src/components/GestionSupervisores.jsx`
- ✅ `frontend/src/components/ActualizarVentas.jsx`
- ✅ `frontend/src/components/SupervisorAuth.jsx`
- ✅ `frontend/src/components/DescargarReportes.jsx`
- ✅ `frontend/src/components/SincronizarGoogleSheets.jsx`

**2. Se crearon archivos de configuración de entorno:**

**`frontend/.env.production`** (para producción con NGINX):
```env
# URL base de la API
# Usar rutas relativas para que funcione con NGINX como proxy
VITE_API_URL=/api
```

**`frontend/.env.development`** (para desarrollo local):
```env
# URL base de la API para desarrollo local
VITE_API_URL=http://localhost:3001/api
```

**3. Se reconstruyó el frontend:**
```bash
cd frontend
npm run build
```

---

## 🔧 Arquitectura NGINX Explicada

### ¿Por qué `/api/index` funciona pero las llamadas API no?

El servidor NGINX actúa como **reverse proxy** y tiene dos responsabilidades:

### 1. Servir el Frontend (React)
```nginx
location / {
    root C:/ruta/al/frontend/dist;
    index index.html;
    try_files $uri $uri/ /index.html;
}
```
- Sirve los archivos estáticos del frontend desde el directorio `dist`
- El navegador descarga HTML, CSS, JS al cliente

### 2. Proxy para el Backend (API)
```nginx
location /api/ {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```
- Cuando el frontend hace una llamada a `/api/...`, NGINX lo redirige a `http://localhost:3001/api/...`
- El backend procesa la petición y devuelve la respuesta a través de NGINX

### Flujo Completo

1. **Acceso desde navegador:** `http://192.168.1.100/api/index`
   - NGINX recibe la petición `/api/index`
   - La redirige a `http://localhost:3001/api/index`
   - El backend (Express) procesa la ruta y devuelve HTML del dashboard

2. **Llamada API desde el frontend:** `/api/motivos`
   - El navegador ejecuta `axios.get("/api/motivos")`
   - La petición va a `http://192.168.1.100/api/motivos` (IP del servidor)
   - NGINX redirige a `http://localhost:3001/api/motivos`
   - El backend devuelve los motivos en JSON

**Antes de la corrección:**
```javascript
axios.get("http://localhost:3001/api/motivos")  // ❌ Falla desde otro dispositivo
```

**Después de la corrección:**
```javascript
axios.get("/api/motivos")  // ✅ Funciona desde cualquier dispositivo
```

---

## 🚀 Solución PM2 v6.x.x en Windows

### Problema
PM2 v6.x.x eliminó el comando `pm2 startup` que se usaba para configurar el auto-inicio en Windows.

### Solución 1: Usar Windows Task Scheduler (Recomendado)

#### Crear Script de Inicio

1. **Crear archivo `start-backend.bat` en el directorio del proyecto:**

```batch
@echo off
cd /d C:\Users\ludwi\OneDrive\Escritorio\kj\Cruzimex\SistemaDeBajas\backend
C:\Users\ludwi\AppData\Roaming\npm\pm2.cmd resurrect
timeout /t 5
exit
```

2. **Configurar Task Scheduler:**

   a. Abrir **Task Scheduler** (Programador de Tareas)

   b. Click derecho en "Task Scheduler Library" → "Create Basic Task"

   c. **Nombre:** `PM2 Backend Cruzimex`

   d. **Trigger:** "When the computer starts"

   e. **Action:** "Start a program"

   f. **Program/script:**
   ```
   C:\Users\ludwi\OneDrive\Escritorio\kj\Cruzimex\SistemaDeBajas\backend\start-backend.bat
   ```

   g. **Start in:**
   ```
   C:\Users\ludwi\OneDrive\Escritorio\kj\Cruzimex\SistemaDeBajas\backend
   ```

3. **Configuración Avanzada:**
   - Click derecho en la tarea → Properties
   - General:
     - ☑ "Run whether user is logged on or not"
     - ☑ "Run with highest privileges"
   - Triggers:
     - Delay task for: 30 seconds (para dar tiempo a que inicie la red)
   - Conditions:
     - ☐ Desmarcar "Start the task only if the computer is on AC power"

4. **Guardar la configuración actual de PM2:**
```bash
pm2 save
```

### Solución 2: Usar NSSM (Alternativa Avanzada)

NSSM (Non-Sucking Service Manager) puede convertir PM2 en un servicio de Windows:

```bash
# 1. Descargar NSSM
# https://nssm.cc/download

# 2. Instalar PM2 como servicio
nssm install PM2Backend "C:\Program Files\nodejs\node.exe" "C:\Users\ludwi\AppData\Roaming\npm\node_modules\pm2\bin\pm2" resurrect

# 3. Configurar el servicio
nssm set PM2Backend AppDirectory "C:\Users\ludwi\OneDrive\Escritorio\kj\Cruzimex\SistemaDeBajas\backend"
nssm set PM2Backend DisplayName "PM2 Backend - Sistema Bajas Cruzimex"
nssm set PM2Backend Description "PM2 Process Manager para Backend"
nssm set PM2Backend Start SERVICE_AUTO_START

# 4. Iniciar el servicio
nssm start PM2Backend
```

### Verificar que PM2 está Corriendo

```bash
# Ver procesos de PM2
pm2 list

# Ver logs
pm2 logs

# Verificar estado
pm2 status
```

---

## 📋 Pasos para Desplegar en Producción

### 1. En tu VM (o servidor de producción):

```bash
# 1. Detener PM2 si está corriendo
pm2 stop all

# 2. Ir al directorio del frontend
cd C:\Users\ludwi\OneDrive\Escritorio\kj\Cruzimex\SistemaDeBajas\frontend

# 3. Asegurarse de que .env.production existe
type .env.production

# 4. Reconstruir el frontend
npm run build

# 5. Copiar los archivos dist a la ubicación de NGINX
xcopy /E /I /Y dist "C:\nginx\html\sistema-bajas"

# 6. Ir al backend
cd ..\backend

# 7. Reiniciar PM2
pm2 start server.js --name "backend-cruzimex"
pm2 save

# 8. Reiniciar NGINX
cd C:\nginx
nginx.exe -s reload
```

### 2. Verificar desde otro dispositivo:

1. Abrir navegador en otro PC/celular en la misma red
2. Ir a: `http://192.168.X.X` (la IP del servidor)
3. **Verificar frontend:** Debería cargar la página
4. **Verificar motivos:** Los motivos ahora deberían cargarse correctamente
5. **Acceso admin:** Ir a `http://192.168.X.X/api/index`

---

## 🔍 Troubleshooting

### Si los motivos aún no cargan:

1. **Verificar que el frontend fue reconstruido:**
   ```bash
   cd frontend
   dir dist  # Verificar fecha de modificación
   ```

2. **Verificar que NGINX apunta al dist correcto:**
   - Abrir `C:\nginx\conf\nginx.conf`
   - Buscar la línea `root` y verificar que apunta a la carpeta `dist` correcta

3. **Verificar consola del navegador:**
   - Presionar F12 en el navegador
   - Ver si hay errores de red (Network tab)
   - Las llamadas deberían ir a `/api/...` no a `http://localhost:3001/api/...`

4. **Verificar que el backend está corriendo:**
   ```bash
   pm2 list
   pm2 logs backend-cruzimex
   ```

5. **Verificar que NGINX está corriendo:**
   ```bash
   tasklist | findstr nginx
   ```

### Si PM2 no inicia automáticamente:

1. **Verificar Task Scheduler:**
   - Abrir Task Scheduler
   - Buscar la tarea "PM2 Backend Cruzimex"
   - Click derecho → Run (para probar)
   - Ver el historial (History tab) para errores

2. **Verificar que pm2 save se ejecutó:**
   ```bash
   pm2 resurrect
   ```

---

## 📝 Resumen de Cambios

### ✅ Archivos Creados/Modificados:

1. **Nuevos archivos de configuración:**
   - `frontend/.env.production` - Variables de entorno para producción
   - `frontend/.env.development` - Variables de entorno para desarrollo
   - `backend/start-backend.bat` - Script para auto-inicio de PM2

2. **Componentes actualizados (6 archivos):**
   - Todas las llamadas API ahora usan rutas relativas `/api/...`
   - Compatible con acceso desde cualquier dispositivo en la red

3. **Frontend reconstruido:**
   - `frontend/dist/` - Archivos optimizados para producción

### 🎯 Resultado Esperado:

- ✅ Frontend accesible desde cualquier dispositivo: `http://IP-SERVIDOR`
- ✅ Motivos y todas las APIs funcionando desde cualquier dispositivo
- ✅ Dashboard admin accesible: `http://IP-SERVIDOR/api/index`
- ✅ PM2 configurado para auto-inicio en Windows
- ✅ Sistema completamente funcional para producción

---

## 🔐 Notas de Seguridad

- Las rutas relativas son más seguras y no exponen el puerto del backend
- NGINX actúa como capa de seguridad entre el cliente y el backend
- Solo el puerto 80 (o 443 para HTTPS) necesita estar abierto en el firewall
- El puerto 3001 del backend solo es accesible localmente en el servidor
