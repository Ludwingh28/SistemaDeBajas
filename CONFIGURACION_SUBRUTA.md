# Configuración del Sistema en Subruta

## 📋 Resumen

El sistema ahora funciona en una **subruta** en lugar de la raíz del servidor:

- ❌ **ANTES:** `http://mi_IP/` y `http://mi_IP/admin`
- ✅ **AHORA:** `http://mi_IP/sistemadebajas/` y `http://mi_IP/sistemadebajas/admin`

Esto permite usar la raíz (`http://mi_IP/`) para otro sistema.

---

## 🔧 Cambios Realizados

### 1. Frontend (`vite.config.js`)

Se agregó la configuración `base` para indicar la subruta:

```javascript
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/sistemadebajas/', // ← Subruta base para producción
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        secure: false
      },
      '/uploads': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
```

### 2. Router de React (`App.jsx`)

Se agregó el `basename` al `BrowserRouter`:

```javascript
function App() {
  return (
    <Router basename="/sistemadebajas"> {/* ← Basename para React Router */}
      <Routes>
        <Route path="/" element={...} />        {/* → /sistemadebajas/ */}
        <Route path="/admin" element={...} />    {/* → /sistemadebajas/admin */}
      </Routes>
    </Router>
  );
}
```

### 3. Configuración de Nginx (`nginx.conf`)

Se configuró Nginx para servir el frontend en `/sistemadebajas/`:

```nginx
# Sistema de Bajas - Frontend en subruta /sistemadebajas/
location /sistemadebajas/ {
    alias C:/inetpub/cruzimex/SistemaDeBajas/frontend/dist/;
    index index.html index.htm;
    try_files $uri $uri/ /sistemadebajas/index.html;
}

# API y uploads siguen en la raíz
location /api/ {
    proxy_pass http://localhost:3001;
    ...
}

location /uploads/ {
    alias C:/inetpub/cruzimex/SistemaDeBajas/backend/uploads/;
}

# Página por defecto en la raíz (para otro sistema)
location / {
    root C:/inetpub/www;
    index index.html index.htm;
}
```

---

## 🚀 Pasos para Desplegar

### **Paso 1: Hacer Backup**

```bash
# Backup de la base de datos
mysqldump -u root -p sistema_bajas > backup_sistema_bajas.sql

# Backup de archivos
xcopy "C:\inetpub\cruzimex\SistemaDeBajas" "C:\backups\sistema_bajas_backup" /E /I /H
```

### **Paso 2: Actualizar el Código**

Copia los archivos modificados al servidor:

```
frontend/vite.config.js        (modificado)
frontend/src/App.jsx           (modificado)
nginx.conf                     (modificado)
```

O si usas Git:

```bash
cd C:\inetpub\cruzimex\SistemaDeBajas
git pull origin main
```

### **Paso 3: Instalar Dependencias (si es necesario)**

```bash
# Frontend
cd frontend
npm install

# Backend (no necesita cambios)
cd ..\backend
npm install
```

### **Paso 4: Construir Frontend para Producción**

```bash
cd frontend
npm run build
```

Este comando genera la carpeta `dist/` con todos los assets configurados para la subruta `/sistemadebajas/`.

### **Paso 5: Actualizar Nginx**

```bash
# Copiar el archivo nginx.conf a la ubicación correcta
copy nginx.conf C:\nginx\conf\nginx.conf

# Reiniciar Nginx
nginx -s reload

# O si usas el servicio:
net stop nginx
net start nginx
```

### **Paso 6: Verificar el Backend**

El backend **NO necesita cambios** porque:
- Las llamadas a `/api/` y `/uploads/` se hacen directamente desde el navegador
- Nginx hace el proxy a estas rutas independientemente de la subruta del frontend

```bash
cd backend
npm start
```

Verifica que el backend esté corriendo en: `http://localhost:3001`

### **Paso 7: Probar el Sistema**

#### En Desarrollo (con Vite):

```bash
cd frontend
npm run dev
```

Abrir: `http://localhost:5173/sistemadebajas/`

#### En Producción (con Nginx):

Abrir: `http://TU_IP/sistemadebajas/`

**Rutas disponibles:**
- `http://TU_IP/sistemadebajas/` → Formulario para vendedores
- `http://TU_IP/sistemadebajas/admin` → Panel de supervisores

---

## ✅ Verificación

Marca cada item después de verificarlo:

### URLs Funcionando:
- [ ] `http://TU_IP/sistemadebajas/` carga correctamente
- [ ] `http://TU_IP/sistemadebajas/admin` carga el panel de admin
- [ ] Los estilos CSS se cargan correctamente
- [ ] Las imágenes se cargan correctamente
- [ ] Las llamadas a `/api/` funcionan
- [ ] Las fotos en `/uploads/` se visualizan

### Funcionalidades:
- [ ] Formulario de vendedores funciona
- [ ] Login de supervisores funciona
- [ ] Aprobar solicitudes funciona
- [ ] Visualizar reportes funciona
- [ ] Descargar reportes funciona
- [ ] Sincronizar Google Sheets funciona

### Navegación:
- [ ] Cambiar de página dentro del sistema funciona
- [ ] Recargar la página mantiene la ruta correcta
- [ ] Los botones "Volver" funcionan correctamente

---

## 🔄 Volver a la Configuración Anterior (Raíz)

Si necesitas volver a la configuración anterior (raíz):

### 1. Modificar `vite.config.js`

```javascript
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // base: '/sistemadebajas/', // ← Comentar o eliminar esta línea
  server: {
    proxy: { ... }
  }
});
```

### 2. Modificar `App.jsx`

```javascript
function App() {
  return (
    <Router> {/* ← Quitar el basename */}
      <Routes>
        ...
      </Routes>
    </Router>
  );
}
```

### 3. Restaurar `nginx.conf`

```nginx
server {
    listen 80;
    server_name localhost;

    root C:/inetpub/cruzimex/SistemaDeBajas/frontend/dist;
    index index.html index.htm;

    location /api/ {
        proxy_pass http://localhost:3001;
        ...
    }

    location /uploads/ {
        alias C:/inetpub/cruzimex/SistemaDeBajas/backend/uploads/;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 4. Reconstruir y Reiniciar

```bash
cd frontend
npm run build
nginx -s reload
```

---

## 📚 Notas Técnicas

### ¿Por qué `/api/` y `/uploads/` no están en la subruta?

Las rutas de API y archivos estáticos **NO están dentro de `/sistemadebajas/`** porque:

1. **Son servicios compartidos:** Pueden ser usados por múltiples frontends
2. **Más fácil de mantener:** No hay que cambiar las rutas de API en el código
3. **Estándar común:** Es práctica común tener las APIs en rutas absolutas

### Estructura de URLs Final:

```
http://mi_IP/
├── /                        → Página principal (otro sistema)
├── /api/                    → Backend API (puerto 3001)
├── /uploads/                → Archivos subidos (fotos)
└── /sistemadebajas/
    ├── /                    → Formulario vendedores
    └── /admin               → Panel supervisores
```

### ¿Qué pasa con los assets (CSS, JS, imágenes)?

Vite automáticamente ajusta todas las rutas de los assets cuando usas `base: '/sistemadebajas/'`:

- `<link href="/assets/index.css">` → `<link href="/sistemadebajas/assets/index.css">`
- `<script src="/assets/index.js">` → `<script src="/sistemadebajas/assets/index.js">`
- `<img src="/logo.png">` → `<img src="/sistemadebajas/logo.png">`

---

## 🆘 Solución de Problemas

### Problema: "404 Not Found" al acceder a `/sistemadebajas/`

**Solución:**
1. Verificar que el frontend esté construido: `npm run build`
2. Verificar que la carpeta `dist/` exista en `frontend/`
3. Verificar la configuración de Nginx (location `/sistemadebajas/`)
4. Reiniciar Nginx: `nginx -s reload`

### Problema: Las rutas internas dan 404 al recargar

**Solución:**
Verificar que Nginx tenga `try_files $uri $uri/ /sistemadebajas/index.html;`

### Problema: Los estilos no cargan

**Solución:**
1. Verificar que `base: '/sistemadebajas/'` esté en `vite.config.js`
2. Reconstruir el frontend: `npm run build`
3. Limpiar caché del navegador (Ctrl+Shift+R)

### Problema: Las llamadas a `/api/` fallan

**Solución:**
1. Verificar que el backend esté corriendo: `http://localhost:3001`
2. Verificar la configuración del proxy en Nginx (location `/api/`)
3. Revisar logs de Nginx: `logs/cruzimex-error.log`

### Problema: Las fotos no cargan

**Solución:**
1. Verificar que la carpeta `backend/uploads/` exista
2. Verificar la configuración de Nginx (location `/uploads/`)
3. Verificar permisos de la carpeta `uploads/`

---

## 📞 Contacto

**Desarrollador:** [Tu contacto]
**Fecha de Configuración:** 2025-02-11
**Versión del Sistema:** 1.3.0

---

## 📝 Checklist Final

Antes de dar por terminado el despliegue:

- [ ] Backup realizado
- [ ] Código actualizado
- [ ] Frontend construido con `npm run build`
- [ ] Nginx configurado y reiniciado
- [ ] Backend corriendo en puerto 3001
- [ ] Sistema accesible en `http://TU_IP/sistemadebajas/`
- [ ] Panel admin accesible en `http://TU_IP/sistemadebajas/admin`
- [ ] Todas las funcionalidades probadas
- [ ] Sin errores en consola del navegador
- [ ] Documentación actualizada

✅ **Sistema listo en subruta /sistemadebajas/**
