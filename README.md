# Sistema de Inhabilitación de Clientes - Cruzimex Ltda.

![Version](https://img.shields.io/badge/version-2.0-blue.svg)
![Node](https://img.shields.io/badge/node-18%2B-green.svg)
![MySQL](https://img.shields.io/badge/mysql-8.0%2B-orange.svg)
![License](https://img.shields.io/badge/license-Proprietary-red.svg)

Sistema web para gestión automatizada de solicitudes de inhabilitación de clientes con validación en tiempo real según políticas comerciales de Cruzimex Ltda.

## 📋 Características Principales

- ✅ **Validación Automática**: Evalúa solicitudes según 4 reglas de negocio predefinidas
- 📊 **Dashboard Multi-Rol**: Interfaces específicas para vendedores, supervisores y administradores
- 🔄 **Sincronización Automática**: Integración con Google Sheets para planificación de rutas (2 veces al día)
- 📈 **Reportes en Tiempo Real**: Generación automática de reportes Excel con estadísticas
- 🖼️ **Gestión de Evidencias**: Upload y almacenamiento de hasta 5 fotografías por solicitud
- 🔒 **Seguridad Robusta**: Autenticación con BCrypt, rate limiting, validación de archivos, APIs protegidas

## 🏗️ Arquitectura

### Stack Tecnológico

**Frontend:**
- React 18.3.1
- Vite 6.0.3
- TailwindCSS 3.4.17
- React Router DOM 7.1.1
- Axios + SweetAlert2
- Lucide React (iconos)

**Backend:**
- Node.js 18+
- Express 5.1.0
- MySQL2 3.13.0
- Multer 2.0.2 (file upload)
- Node-Cron 3.0.3 (scheduler)
- ExcelJS 4.4.0 (reportes)
- BCrypt 5.1.1 (hash de contraseñas)

**Base de Datos:**
- MySQL 8.0+
- Modelo normalizado (3FN)
- 5 tablas principales + tablas de relación
- Índices optimizados para consultas rápidas

## 🚀 Instalación

### Prerequisitos

- Node.js 18+ o 20+
- MySQL 8.0+
- npm o yarn
- Git

### 1. Clonar Repositorio

```bash
git clone https://github.com/Ludwingh28/SistemaDeBajas.git
cd SistemaDeBajas
```

### 2. Configurar Backend

```bash
cd backend
npm install

# Copiar archivo de entorno
cp .env.example .env

# Editar .env con tus configuraciones
nano .env
```

**Variables de Entorno Esenciales:**

```env
# Servidor
PORT=3001
NODE_ENV=development

# Base de Datos
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=sistema_bajas

# Google Sheets (URL completa del CSV export)
GOOGLE_SHEET_URL=https://docs.google.com/spreadsheets/d/.../export?format=csv

# Seguridad - Código del administrador principal
ADMIN_CODE=hash_bcrypt_del_codigo_admin

# Frontend
FRONTEND_URL=http://localhost:5173
```

### 3. Inicializar Base de Datos

```bash
# Crear base de datos
mysql -u root -p
CREATE DATABASE sistema_bajas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;

# Ejecutar script de inicialización
cd backend
npm run init-db

# Ejecutar migración de normalización
npm run migrate
```

### 4. Generar Hash para Código de Administrador

```bash
cd backend
npm run generate-hash

# Ingresar el código cuando se solicite
# Copiar el hash generado y pegarlo en .env como ADMIN_CODE
```

### 5. Configurar Frontend

```bash
cd ../frontend
npm install
```

### 6. Iniciar Servicios

**Terminal 1 - Backend:**
```bash
cd backend
npm start
# Backend corriendo en http://localhost:3001
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Frontend corriendo en http://localhost:5173
```

**Acceso al sistema:**
- **Vendedores:** http://localhost:5173
- **Supervisores/Administradores:** http://localhost:3001/api/index

## 📖 Documentación

### Documentación Disponible

1. **[Documentación Técnica](docs/DocumentacionTecnica.tex)** (LaTeX)
   - Arquitectura del sistema completo
   - Diseño de base de datos normalizada
   - APIs y endpoints con seguridad
   - Lógica de negocio y validaciones
   - Guía de deployment en producción

2. **[Documentación de Usuario](docs/DocumentacionUsuario.tex)** (LaTeX)
   - Manual completo para vendedores
   - Manual para supervisores
   - Manual para administradores
   - FAQ y troubleshooting
   - Glosario de términos

3. **[Checklist de Producción](PRODUCCION_CHECKLIST.md)**
   - Lista completa de verificación
   - Configuraciones de seguridad
   - Optimizaciones de rendimiento
   - Comandos de deployment

4. **[Instrucciones de Migración](INSTRUCCIONES_MIGRACION.md)**
   - Guía paso a paso de migración
   - Normalización de base de datos
   - Sincronización con Google Sheets

### Compilar Documentación PDF

```bash
cd docs

# Opción 1: pdflatex (requiere instalación de LaTeX)
pdflatex DocumentacionTecnica.tex
pdflatex DocumentacionTecnica.tex  # 2da pasada para generar ToC

pdflatex DocumentacionUsuario.tex
pdflatex DocumentacionUsuario.tex

# Opción 2: Usar Overleaf (online)
# 1. Subir archivo .tex a overleaf.com
# 2. Compilar y descargar PDF
```

Ver [docs/COMPILAR_LATEX.md](docs/COMPILAR_LATEX.md) para más información.

## 🎯 Reglas de Negocio

El sistema valida solicitudes de baja según 4 reglas automáticas:

### ✅ Regla 1: Sin Ventas
**Condición:** Cliente no tiene ventas registradas
**Resultado:** **APROBADO** (SI)
**Acción:** Puede proceder con la inhabilitación

### ✅ Regla 2: Ventas Antiguas
**Condición:** Última venta > 90 días
**Resultado:** **APROBADO** (SI)
**Acción:** Puede proceder con la inhabilitación

### ❌ Regla 3: Ventas Recientes
**Condición:** Última venta ≤ 90 días (motivo NO es "duplicado")
**Resultado:** **RECHAZADO** (NO)
**Acción:** No proceder - Cliente activo comercialmente

### ⚠️ Regla 4: Duplicado Especial
**Condición:** Última venta ≤ 90 días + motivo "duplicado"
**Resultado:** **DERIVADO A REVISIÓN MANUAL**
**Acción:** Inteligencia Comercial revisará en 2-4 horas

## 🔄 Sincronización con Google Sheets

### Configuración del Google Sheet

1. Crear Google Sheet con las siguientes columnas **EXACTAS**:
   - `RUTA` - Código de ruta (ej: SC-RUTA 11)
   - `ZONA` - Zona geográfica (ej: SC DTS 1)
   - `DIA` - Día de la semana (ej: 3-MI para Miércoles)
   - `VENDEDOR` - Nombre completo del vendedor

2. Compartir como público: **"Anyone with the link can view"**

3. Obtener URL de exportación CSV:
   ```
   https://docs.google.com/spreadsheets/d/ID_DEL_SHEET/export?format=csv
   ```

4. Configurar en `.env`:
   ```env
   GOOGLE_SHEET_URL=https://docs.google.com/spreadsheets/d/.../export?format=csv
   ```

### Sincronización Automática

El sistema sincroniza automáticamente 2 veces al día (horario Bolivia GMT-4):
- 🌅 **6:00 AM** - Sincronización matutina
- 🌆 **7:00 PM** - Sincronización vespertina

### Sincronización Manual

Desde el dashboard de administrador (`/api/index`):

- **Botón ROJO** - Limpiar y Recargar TODO
  - ⚠️ OPERACIÓN DESTRUCTIVA
  - Elimina TODOS los datos actuales
  - Recarga desde cero
  - Usar solo en casos extremos

- **Botón ÁMBAR** - Migración Inicial
  - Primera carga de datos
  - Usar cuando la tabla está vacía
  - Ideal para setup inicial

- **Botón AZUL** - Sincronizar Ahora
  - Actualización incremental
  - Inserta nuevos registros
  - Actualiza registros existentes
  - **Opción recomendada**

## 📊 Estructura del Proyecto

```
SistemaDeBajas/
├── backend/
│   ├── config/              # Configuración DB y cache
│   │   ├── database.js
│   │   └── cache.js
│   ├── middleware/          # Middlewares de seguridad
│   │   ├── auth.js          # Autenticación supervisores
│   │   ├── uploadHandler.js # Upload de fotos
│   │   ├── rateLimiter.js   # Rate limiting
│   │   └── errorHandler.js  # Manejo de errores
│   ├── models/              # Modelos de datos
│   │   ├── Cliente.js
│   │   ├── Venta.js
│   │   ├── Reporte.js
│   │   ├── Supervisor.js
│   │   ├── Zona.js
│   │   ├── Ruta.js
│   │   ├── Vendedor.js
│   │   └── Dia.js
│   ├── routes/              # Rutas API
│   │   ├── bajas.js         # Solicitudes de baja
│   │   ├── planificacion.js # Gestión de rutas
│   │   ├── reportes.js      # Descarga de reportes
│   │   ├── supervisores.js  # CRUD supervisores
│   │   └── admin.js         # Dashboard admin
│   ├── services/            # Lógica de negocio
│   │   ├── validatorMySQL.js           # Validación de reglas
│   │   ├── planificacionSyncService.js # Sync Google Sheets
│   │   └── reportGenerator.js          # Generación de Excel
│   ├── migrations/          # Scripts SQL
│   │   ├── init.sql                # Creación inicial
│   │   └── normalize_planificacion.sql
│   ├── scripts/             # Utilidades
│   │   ├── initDatabase.js
│   │   ├── runMigration.js
│   │   ├── generateHash.js
│   │   └── testGoogleSheets.js
│   ├── uploads/             # Fotos subidas (gitignored)
│   ├── reportes/            # Excel generados (gitignored)
│   ├── logs/                # Logs (gitignored)
│   ├── .env                 # Variables de entorno (gitignored)
│   ├── package.json
│   └── index.js             # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/      # Componentes React
│   │   │   ├── VendedorDashboard.jsx
│   │   │   ├── SupervisorAuth.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── DescargarReportes.jsx  # Con estadísticas
│   │   │   ├── SincronizarGoogleSheets.jsx
│   │   │   └── ...
│   │   ├── utils/
│   │   │   └── api.js       # Configuración Axios
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   │   └── cruzimex-logo.png
│   ├── package.json
│   └── vite.config.js
├── docs/
│   ├── DocumentacionTecnica.tex
│   ├── DocumentacionUsuario.tex
│   └── COMPILAR_LATEX.md
├── .gitignore
├── PRODUCCION_CHECKLIST.md
├── INSTRUCCIONES_MIGRACION.md
└── README.md                # Este archivo
```

## 🔧 Scripts Disponibles

### Backend

```bash
npm start              # Iniciar servidor (producción)
npm run dev            # Iniciar con nodemon (desarrollo)
npm run init-db        # Crear tablas iniciales
npm run migrate        # Ejecutar migración de normalización
npm run generate-hash  # Generar hash BCrypt para códigos
```

### Frontend

```bash
npm run dev      # Servidor de desarrollo Vite
npm run build    # Build para producción
npm run preview  # Preview del build
```

## 🐛 Troubleshooting

### Error: Cannot connect to MySQL

```bash
# Verificar que MySQL está corriendo
sudo systemctl status mysql
# o en Windows: net start MySQL80

# Verificar credenciales en .env
cat backend/.env | grep DB_

# Probar conexión manual
mysql -u root -p -h localhost
```

### Error: Port already in use

```bash
# En Linux/Mac - Encontrar proceso usando el puerto
lsof -i :3001
kill -9 <PID>

# En Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Sincronización Google Sheets falla

```bash
# Probar conexión
cd backend
node scripts/testGoogleSheets.js

# Verificar que la URL en .env sea de exportación CSV
# Debe terminar en: /export?format=csv

# Verificar logs
tail -f logs/sync.log  # Linux/Mac
type logs\sync.log     # Windows
```

### Fotos no se cargan

```bash
# Verificar que existe el directorio
ls -la backend/uploads/

# Crear si no existe
mkdir -p backend/uploads

# Verificar permisos (Linux/Mac)
chmod 755 backend/uploads
chown $USER:$GROUP backend/uploads
```

### Código de supervisor no funciona

```bash
# Generar nuevo hash
cd backend
npm run generate-hash

# Actualizar en base de datos o .env según corresponda
```

## 📝 API Endpoints

### Bajas (Públicos)
- `POST /api/bajas/solicitar` - Solicitar inhabilitación
- `GET /api/bajas/estadisticas` - Estadísticas del día (público)

### Planificación (Mixto)
- `GET /api/planificacion/rutas` - Listar rutas (público)
- `GET /api/planificacion/zonas` - Listar zonas (público)
- `GET /api/planificacion/vendedores` - Listar vendedores (público)
- `GET /api/planificacion/dias` - Listar días (público)
- `POST /api/planificacion/migrar` - Migración inicial (**requiere auth**)
- `POST /api/planificacion/sincronizar` - Sincronizar (**requiere auth**)
- `DELETE /api/planificacion/limpiar` - Limpiar datos (**requiere auth**)

### Reportes (**requieren auth**)
- `POST /api/reportes/descargar` - Reporte del día
- `POST /api/reportes/descargar-historico` - Reporte por rango de fechas

### Supervisores (**requieren auth admin**)
- `POST /api/supervisores` - Crear supervisor
- `GET /api/supervisores` - Listar supervisores
- `PUT /api/supervisores/:id` - Actualizar supervisor
- `DELETE /api/supervisores/:id` - Eliminar supervisor

**Nota de Seguridad:** Los endpoints marcados con "**requiere auth**" necesitan enviar `codigoSupervisor` en el body de la petición. Estas rutas NO son accesibles mediante URL directa desde el navegador, solo a través de la interfaz administrativa.

Ver [docs/DocumentacionTecnica.pdf](docs/) para documentación completa de API.

## 🔒 Seguridad

### Implementaciones de Seguridad

- ✅ **Autenticación:** Códigos hasheados con BCrypt (factor 10)
- ✅ **Almacenamiento:** Supervisores en BD, solo admin principal en `.env`
- ✅ **Rate Limiting:**
  - Bajas: 10 solicitudes/15min por IP
  - General: 100 requests/15min por IP
- ✅ **Validación de Archivos:**
  - Tipos permitidos: JPG, JPEG, PNG, WEBP
  - Tamaño máximo: 5MB por archivo
  - Máximo 5 archivos por solicitud
- ✅ **CORS:** Configurado para frontend específico únicamente
- ✅ **HTTP Headers:** Helmet.js para headers de seguridad
- ✅ **SQL Injection:** Queries parametrizadas con MySQL2
- ✅ **XSS:** Sanitización de inputs
- ✅ **APIs Protegidas:** Middleware de autenticación en rutas administrativas

### APIs Protegidas

Las siguientes APIs requieren código de supervisor válido:
- POST /api/planificacion/migrar
- POST /api/planificacion/sincronizar
- DELETE /api/planificacion/limpiar
- Todas las rutas de /api/reportes
- Todas las rutas de /api/supervisores

## 📦 Deployment en Producción

### Opción 1: Deployment con PM2

```bash
# 1. Build del frontend
cd frontend
npm run build
# Los archivos se generan en frontend/dist/

# 2. Instalar PM2 globalmente
npm install -g pm2

# 3. Iniciar backend con PM2
cd ../backend
pm2 start index.js --name "bajas-backend"

# 4. Guardar configuración PM2
pm2 save

# 5. Configurar inicio automático
pm2 startup
# Ejecutar el comando que PM2 muestra
```

### Opción 2: Configuración con Nginx

```nginx
server {
    listen 80;
    server_name bajas.cruzimex.com;

    # Frontend estático
    location / {
        root /var/www/bajas/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Variables de Entorno en Producción

```env
NODE_ENV=production
PORT=3001
DB_HOST=localhost
DB_USER=cruzimex_user
DB_PASSWORD=<PASSWORD_SEGURO>
DB_NAME=sistema_bajas
GOOGLE_SHEET_URL=https://docs.google.com/spreadsheets/.../export?format=csv
ADMIN_CODE=<HASH_BCRYPT>
FRONTEND_URL=https://bajas.cruzimex.com
```

Ver [PRODUCCION_CHECKLIST.md](PRODUCCION_CHECKLIST.md) para checklist completo.

## 🤝 Contribuir

Este es un proyecto privado de **Cruzimex Ltda**. Para contribuciones internas:

1. Crear rama feature: `git checkout -b feature/nueva-funcionalidad`
2. Commit cambios: `git commit -m 'Add: nueva funcionalidad'`
3. Push a rama: `git push origin feature/nueva-funcionalidad`
4. Crear Pull Request en GitHub

### Convenciones de Commits

- `Add:` Nueva funcionalidad
- `Fix:` Corrección de bug
- `Update:` Actualización de funcionalidad existente
- `Refactor:` Refactorización de código
- `Docs:` Cambios en documentación
- `Security:` Mejoras de seguridad
- `Perf:` Optimización de rendimiento

### Estándares de Código

- **JavaScript:** ESLint configurado
- **React:** Componentes funcionales con hooks
- **Nombres:** camelCase para variables, PascalCase para componentes
- **Comentarios:** JSDoc para funciones importantes
- **Async/Await:** Preferir sobre callbacks o .then()

## 📞 Soporte

**Desarrollador Principal:**
Ludwing Julian Herrera Justiniano
Ing. de Sistemas - Desarrollador Full Stack Web

**Empresa:**
Cruzimex Ltda.

**Email de Soporte:**
sistemas@cruzimex.com

**Repositorio:**
https://github.com/Ludwingh28/SistemaDeBajas

**Horario de Atención:**
- Lunes a Viernes: 8:00 AM - 6:00 PM
- Sábados: 8:00 AM - 12:00 PM

## 📄 Licencia

Copyright © 2024 Cruzimex Ltda. Todos los derechos reservados.

Este software es propiedad de **Cruzimex Ltda.** y está protegido por leyes de derechos de autor.
Prohibida su reproducción, distribución o uso no autorizado sin permiso expreso de Cruzimex Ltda.

## ✨ Changelog

### v2.0.0 (2024-11-25)

**Cambios Mayores:**
- ✨ Normalización completa de base de datos (5 tablas relacionales)
- 🔄 Sincronización automática con Google Sheets (2x día)
- 📊 Nuevo modelo de planificación con soporte multi-día para rutas
- 🔒 Mejoras de seguridad: APIs protegidas con autenticación
- 📈 Dashboard con estadísticas en tiempo real
- 📚 Documentación técnica y de usuario completa en LaTeX

**Mejoras:**
- 🔧 Optimización de rendimiento con índices de BD
- 🐛 Corrección de duplicados en rutas
- 🎨 Mejoras visuales en dashboards
- 📦 Preparación completa para deployment en producción
- ⚡ Carga de datos más rápida con batch INSERT
- 🗂️ Gestión de supervisores desde interfaz web

**Seguridad:**
- 🔐 Códigos de supervisores en BD (no en .env)
- 🛡️ Middleware de autenticación en rutas administrativas
- 🚫 Rate limiting mejorado
- 🔒 Validación estricta de archivos subidos

**Documentación:**
- 📖 Manual técnico completo (100+ páginas LaTeX)
- 📘 Manual de usuario con guías paso a paso
- 📋 Checklist de producción
- 📝 Instrucciones de migración detalladas

### v1.0.0 (2024-10-01)

**Lanzamiento Inicial:**
- 🎉 Sistema de validación automática de solicitudes
- ✅ 4 reglas de negocio implementadas
- 📤 Sistema de upload de fotografías (hasta 5)
- 📊 Generación de reportes Excel
- 👥 Dashboards diferenciados por rol
- 🗄️ Base de datos inicial con MySQL

---

## 🙏 Agradecimientos

Agradecimientos especiales al equipo de Cruzimex Ltda. por su colaboración y feedback durante el desarrollo del sistema.

---

**Desarrollado con ❤️ por Ludwing Julian Herrera Justiniano para Cruzimex Ltda.**

**Versión:** 2.0.0
**Última actualización:** Noviembre 2025
