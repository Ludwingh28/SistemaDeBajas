# Guía Completa de Deployment en Windows Server 2022

**Sistema de Inhabilitación de Clientes - Cruzimex Ltda.**

Esta guía proporciona instrucciones paso a paso para desplegar el sistema completo en Windows Server 2022 usando NGINX como servidor web y proxy reverso.

---

## 📋 Tabla de Contenidos

1. [Prerequisitos](#prerequisitos)
2. [Instalación de MySQL](#instalación-de-mysql)
3. [Instalación de Node.js](#instalación-de-nodejs)
4. [Instalación de NGINX](#instalación-de-nginx)
5. [Instalación de PM2](#instalación-de-pm2)
6. [Configuración del Sistema](#configuración-del-sistema)
7. [Configuración de NGINX](#configuración-de-nginx)
8. [Ejecución y Pruebas](#ejecución-y-pruebas)
9. [Configuración como Servicio Windows](#configuración-como-servicio-windows)
10. [Configuración de SSL (HTTPS)](#configuración-de-ssl-https)
11. [Monitoreo y Logs](#monitoreo-y-logs)
12. [Troubleshooting](#troubleshooting)
13. [Mantenimiento](#mantenimiento)

---

## 1. Prerequisitos

### Hardware Recomendado

- **RAM:** Mínimo 4GB, recomendado 8GB
- **CPU:** 2 cores mínimo, 4 cores recomendado
- **Disco:** 50GB mínimo de espacio libre
- **Sistema Operativo:** Windows Server 2022 (Standard o Datacenter)

### Software Requerido

- Acceso de administrador al servidor
- Conexión a internet estable
- Cliente RDP para acceso remoto (si aplica)

### Puertos Requeridos

| Puerto | Servicio | Descripción                  |
| ------ | -------- | ---------------------------- |
| 80     | HTTP     | Acceso web principal         |
| 443    | HTTPS    | Acceso web seguro (opcional) |
| 3001   | Backend  | API Node.js (interno)        |
| 3306   | MySQL    | Base de datos (interno)      |

⚠️ **Importante:** Abrir puertos 80 y 443 en el Firewall de Windows.

---

## 2. Instalación de MySQL

### Paso 1: Descargar MySQL

1. Abrir navegador en el servidor
2. Ir a: https://dev.mysql.com/downloads/installer/
3. Descargar: **MySQL Installer for Windows** (versión completa ~400MB)
4. Elegir: `mysql-installer-community-8.x.x.msi`

### Paso 2: Instalar MySQL

1. **Ejecutar instalador** (Clic derecho → Ejecutar como administrador)

2. **Setup Type:**

   - Seleccionar: **"Developer Default"**
   - Click en **"Next"**

3. **Check Requirements:**

   - Si falta algún componente, click en **"Execute"** para instalarlo
   - Click en **"Next"**

4. **Installation:**

   - Click en **"Execute"** para iniciar la instalación
   - Esperar a que todos los componentes se instalen
   - Click en **"Next"**

5. **Product Configuration:**
   - Click en **"Next"**

### Paso 3: Configurar MySQL Server

1. **Type and Networking:**

   - Config Type: **"Development Computer"**
   - TCP/IP: ✅ Activado
   - Port: **3306** (default)
   - Open Windows Firewall: ✅ **Activado**
   - Click en **"Next"**

2. **Authentication Method:**

   - Seleccionar: **"Use Strong Password Encryption"**
   - Click en **"Next"**

3. **Accounts and Roles:**

   - **Root Password:** Ingresar contraseña segura (mínimo 8 caracteres)
   - ⚠️ **IMPORTANTE:** Anotar esta contraseña, la necesitarás después
   - Confirmar contraseña
   - Click en **"Add User"** (opcional, para crear usuario específico)
     - Username: `cruzimex_user`
     - Password: [contraseña segura]
     - Role: **DB Admin**
   - Click en **"Next"**

4. **Windows Service:**

   - Configure MySQL Server as Windows Service: ✅ **Activado**
   - Windows Service Name: **MySQL80**
   - Start at System Startup: ✅ **Activado**
   - Run Windows Service as: **Standard System Account**
   - Click en **"Next"**

5. **Apply Configuration:**

   - Click en **"Execute"**
   - Esperar a que todas las configuraciones se apliquen
   - Click en **"Finish"**

6. **Product Configuration (Continuar):**
   - Click en **"Next"**
   - Click en **"Finish"**

### Paso 4: Verificar Instalación de MySQL

```cmd
# Abrir Command Prompt como administrador
# Probar conexión
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p

# Ingresar password cuando se solicite
# Deberías ver: mysql>

# Verificar versión
SELECT VERSION();

# Salir
EXIT;
```

### Paso 5: Agregar MySQL al PATH

1. Clic derecho en **"Este equipo"** → **"Propiedades"**
2. **"Configuración avanzada del sistema"**
3. **"Variables de entorno"**
4. En **"Variables del sistema"**, seleccionar **"Path"** → **"Editar"**
5. Click en **"Nuevo"**
6. Agregar: `C:\Program Files\MySQL\MySQL Server 8.0\bin`
7. Click **"Aceptar"** en todas las ventanas

### Paso 6: Crear Base de Datos

```cmd
# Conectar a MySQL
mysql -u root -p

# Crear base de datos
CREATE DATABASE sistema_bajas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Crear usuario específico (recomendado)
CREATE USER 'cruzimex_user'@'localhost' IDENTIFIED BY 'TuPasswordSegura123!';

# Otorgar permisos
GRANT ALL PRIVILEGES ON sistema_bajas.* TO 'cruzimex_user'@'localhost';

# Aplicar cambios
FLUSH PRIVILEGES;

# Verificar
SHOW DATABASES;
USE sistema_bajas;

# Salir
EXIT;
```

✅ **MySQL instalado y configurado correctamente**

---

## 3. Instalación de Node.js

### Paso 1: Descargar Node.js

1. Ir a: https://nodejs.org/
2. Descargar: **LTS (Long Term Support)** - Versión 20.x.x recomendada
3. Elegir: **Windows Installer (.msi) 64-bit**

### Paso 2: Instalar Node.js

1. **Ejecutar instalador** (Clic derecho → Ejecutar como administrador)

2. **Welcome Screen:**

   - Click en **"Next"**

3. **License Agreement:**

   - Aceptar términos
   - Click en **"Next"**

4. **Destination Folder:**

   - Dejar default: `C:\Program Files\nodejs\`
   - Click en **"Next"**

5. **Custom Setup:**

   - Dejar todas las opciones por default
   - Asegurar que esté marcado: **"Add to PATH"**
   - Click en **"Next"**

6. **Tools for Native Modules:**

   - ✅ Marcar: **"Automatically install necessary tools"**
   - Click en **"Next"**

7. **Ready to Install:**

   - Click en **"Install"**

8. **Completing Setup:**

   - Click en **"Finish"**

9. **Instalación de herramientas adicionales:**
   - Se abrirá una ventana de PowerShell
   - Presionar Enter para instalar herramientas (chocolatey, Python, etc.)
   - Esperar a que termine (puede tomar 10-15 minutos)

### Paso 3: Verificar Instalación

```cmd
# Abrir nuevo Command Prompt (importante: nuevo)
node --version
# Debe mostrar: v20.x.x

npm --version
# Debe mostrar: 10.x.x
```

✅ **Node.js y npm instalados correctamente**

---

## 4. Instalación de NGINX

### Paso 1: Descargar NGINX

1. Ir a: http://nginx.org/en/download.html
2. Descargar: **nginx/Windows-x.xx.x** (Stable version)
3. Ejemplo: `nginx-1.24.0.zip`

### Paso 2: Extraer e Instalar NGINX

1. **Extraer archivo:**

   - Clic derecho en el archivo ZIP → **"Extraer todo"**
   - Ubicación recomendada: `C:\nginx`
   - Resultado: `C:\nginx\nginx-1.24.0\`

2. **Renombrar carpeta (opcional pero recomendado):**

   ```cmd
   # Abrir Command Prompt como administrador
   cd C:\nginx
   rename nginx-1.24.0 nginx
   ```

   Resultado final: `C:\nginx\nginx\`

3. **Estructura de carpetas:**
   ```
   C:\nginx\nginx\
   ├── conf\           # Archivos de configuración
   ├── html\           # Archivos estáticos default
   ├── logs\           # Logs de NGINX
   ├── temp\           # Archivos temporales
   └── nginx.exe       # Ejecutable principal
   ```

### Paso 3: Verificar NGINX

```cmd
# Navegar a la carpeta de NGINX
cd C:\nginx\nginx

# Verificar versión
nginx -v
# Debe mostrar: nginx version: nginx/1.24.0

# Probar configuración
nginx -t
# Debe mostrar: syntax is ok
```

### Paso 4: Iniciar NGINX (Prueba Inicial)

```cmd
cd C:\nginx\nginx

# Iniciar NGINX
start nginx

# Verificar que está corriendo
tasklist /fi "imagename eq nginx.exe"
# Deberías ver 2 procesos nginx.exe
```

### Paso 5: Probar en Navegador

1. Abrir navegador
2. Ir a: `http://localhost`
3. Deberías ver: **"Welcome to nginx!"**

### Paso 6: Detener NGINX

```cmd
cd C:\nginx\nginx

# Detener NGINX
nginx -s stop
```

✅ **NGINX instalado y funcionando correctamente**

---

## 5. Instalación de PM2

PM2 es un gestor de procesos para Node.js que mantiene tu aplicación corriendo continuamente.

### Paso 1: Instalar PM2 Globalmente

```cmd
# Abrir Command Prompt como administrador
npm install -g pm2

# Verificar instalación
pm2 --version
# Debe mostrar: 5.x.x
```

### Paso 2: Instalar pm2-windows-service

Para que PM2 se ejecute como servicio de Windows:

```cmd
# Instalar pm2-windows-service
npm install -g pm2-windows-service

# Configurar como servicio
pm2-service-install

# Cuando pregunte:
# - Perform environment setup? YES
# - Set PM2_HOME? YES → Usar default (C:\ProgramData\pm2\home)
# - Set service name? → Usar default (PM2)
```

### Paso 3: Verificar Servicio

1. Abrir **"Servicios"** (services.msc)
2. Buscar: **"PM2"**
3. Verificar que esté en estado: **"En ejecución"**
4. Tipo de inicio: **"Automático"**

✅ **PM2 instalado como servicio de Windows**

---

## 6. Configuración del Sistema

### Paso 1: Crear Estructura de Carpetas

```cmd
# Crear carpeta para la aplicación
mkdir C:\inetpub\cruzimex
cd C:\inetpub\cruzimex

# La estructura será:
# C:\inetpub\cruzimex\
# ├── SistemaDeBajas\  (clon del repositorio)
# ├── logs\            (logs generales)
```

### Paso 2: Clonar Repositorio

**Opción A: Usando Git (Recomendado)**

```cmd
# Instalar Git si no está instalado
# Descargar de: https://git-scm.com/download/win

# Clonar repositorio
cd C:\inetpub\cruzimex
git clone https://github.com/Ludwingh28/SistemaDeBajas.git
cd SistemaDeBajas
```

**Opción B: Subir archivos manualmente**

1. Comprimir tu proyecto local en ZIP
2. Transferir a servidor (RDP, FTP, etc.)
3. Extraer en: `C:\inetpub\cruzimex\SistemaDeBajas\`

### Paso 3: Instalar Dependencias del Backend

```cmd
cd C:\inetpub\cruzimex\SistemaDeBajas\backend

# Instalar dependencias
npm install --production

# Verificar que node_modules se creó
dir
```

### Paso 4: Configurar Variables de Entorno (.env)

```cmd
cd C:\inetpub\cruzimex\SistemaDeBajas\backend

# Copiar ejemplo
copy .env.example .env

# Editar con Notepad
notepad .env
```

**Configuración del archivo .env:**

```env
# Servidor
PORT=3001
NODE_ENV=production

# Base de Datos
DB_HOST=localhost
DB_PORT=3306
DB_USER=cruzimex_user
DB_PASSWORD=TuPasswordSegura123!
DB_NAME=sistema_bajas

# Google Sheets
GOOGLE_SHEET_URL=https://docs.google.com/spreadsheets/d/TU_ID/export?format=csv

# Seguridad - Código del administrador principal
ADMIN_CODE=$2b$10$HASH_GENERADO_CON_BCRYPT

# Frontend (URL pública del servidor)
FRONTEND_URL=http://TU_IP_O_DOMINIO
```

⚠️ **IMPORTANTE:** Guardar y cerrar el archivo

### Paso 5: Generar Hash para Código de Administrador

```cmd
cd C:\inetpub\cruzimex\SistemaDeBajas\backend

# Ejecutar script de generación
node scripts/generateHash.js

# Ingresar código cuando se solicite (ejemplo: admin2024)
# COPIAR el hash generado
# Ejemplo: $2b$10$abcdefghijklmnopqrstuvwxyz1234567890

# Editar .env y pegar el hash
notepad .env
# Reemplazar ADMIN_CODE con el hash copiado
```

### Paso 6: Inicializar Base de Datos

```cmd
cd C:\inetpub\cruzimex\SistemaDeBajas\backend

# Ejecutar script de inicialización
node scripts/initDatabase.js

# Deberías ver:
# ✓ Base de datos inicializada correctamente
# ✓ Tablas creadas
```

### Paso 7: Ejecutar Migración de Normalización

```cmd
cd C:\inetpub\cruzimex\SistemaDeBajas\backend

# Ejecutar migración
node scripts/runMigration.js

# Deberías ver:
# ✓ Migración completada exitosamente
# ✓ Tablas normalizadas creadas
```

### Paso 8: Build del Frontend

```cmd
cd C:\inetpub\cruzimex\SistemaDeBajas\frontend

# Instalar dependencias
npm install

# Crear build de producción
npm run build

# Verificar que se creó la carpeta dist
dir
# Deberías ver: dist\
```

✅ **Sistema configurado y listo para ejecutar**

---

## 7. Configuración de NGINX

### Paso 1: Backup de Configuración Original

```cmd
cd C:\nginx\nginx\conf

# Crear backup
copy nginx.conf nginx.conf.backup
```

### Paso 2: Crear Configuración para Cruzimex

```cmd
cd C:\nginx\nginx\conf

# Crear archivo de configuración
notepad nginx.conf
```

**Reemplazar TODO el contenido con:**

```nginx
worker_processes  4;

events {
    worker_connections  1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;

    # Configuración de logs
    access_log  logs/access.log;
    error_log   logs/error.log;

    sendfile        on;
    keepalive_timeout  65;

    # Configuración de compresión
    gzip  on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    # Límites de tamaño de archivos (para fotos)
    client_max_body_size 25M;

    # Servidor principal
    server {
        listen       80;
        server_name  localhost;  # Cambiar por tu IP o dominio

        # Charset
        charset utf-8;

        # Logs específicos del servidor
        access_log  logs/cruzimex-access.log;
        error_log   logs/cruzimex-error.log;

        # Root para el frontend
        location / {
            root   C:/inetpub/cruzimex/SistemaDeBajas/frontend/dist;
            index  index.html index.htm;
            try_files $uri $uri/ /index.html;

            # Headers de seguridad
            add_header X-Frame-Options "SAMEORIGIN" always;
            add_header X-Content-Type-Options "nosniff" always;
            add_header X-XSS-Protection "1; mode=block" always;
        }

        # Proxy para el Backend API
        location /api/ {
            proxy_pass http://localhost:3001;
            proxy_http_version 1.1;

            # Headers
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;

            # Cache bypass
            proxy_cache_bypass $http_upgrade;
        }

        # Archivos estáticos del backend (fotos subidas)
        location /uploads/ {
            alias C:/inetpub/cruzimex/SistemaDeBajas/backend/uploads/;
            expires 30d;
            add_header Cache-Control "public, immutable";
        }

        # Error pages
        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   html;
        }
    }
}
```

⚠️ **Importante:**

- Reemplazar `localhost` en `server_name` por tu IP o dominio
- Las rutas usan `/` en vez de `\` en la configuración de NGINX

### Paso 3: Verificar Configuración de NGINX

```cmd
cd C:\nginx\nginx

# Probar configuración
nginx -t

# Deberías ver:
# nginx: the configuration file C:\nginx\nginx/conf/nginx.conf syntax is ok
# nginx: configuration file C:\nginx\nginx/conf/nginx.conf test is successful
```

### Paso 4: Crear Script de Gestión de NGINX

Crear archivo: `C:\nginx\nginx\nginx-manager.bat`

```batch
@echo off
REM Script de gestión de NGINX para Cruzimex

:menu
cls
echo ========================================
echo   NGINX Manager - Sistema Cruzimex
echo ========================================
echo.
echo 1. Iniciar NGINX
echo 2. Detener NGINX
echo 3. Reiniciar NGINX
echo 4. Verificar estado
echo 5. Ver logs de error
echo 6. Probar configuración
echo 7. Salir
echo.
set /p option=Seleccione una opción (1-7):

if "%option%"=="1" goto start
if "%option%"=="2" goto stop
if "%option%"=="3" goto restart
if "%option%"=="4" goto status
if "%option%"=="5" goto logs
if "%option%"=="6" goto test
if "%option%"=="7" goto end

:start
echo Iniciando NGINX...
start nginx
timeout /t 2 >nul
goto status

:stop
echo Deteniendo NGINX...
nginx -s stop
timeout /t 2 >nul
goto menu

:restart
echo Reiniciando NGINX...
nginx -s reload
timeout /t 2 >nul
echo NGINX reiniciado correctamente
pause
goto menu

:status
echo.
echo Estado de NGINX:
tasklist /fi "imagename eq nginx.exe"
echo.
pause
goto menu

:logs
echo.
echo Últimas líneas del log de errores:
type logs\error.log | more
pause
goto menu

:test
echo.
echo Probando configuración...
nginx -t
pause
goto menu

:end
exit
```

✅ **NGINX configurado correctamente**

---

## 8. Ejecución y Pruebas

### Paso 1: Iniciar Backend con PM2

```cmd
cd C:\inetpub\cruzimex\SistemaDeBajas\backend

# Iniciar aplicación con PM2
pm2 start index.js --name "cruzimex-backend"

# Verificar estado
pm2 status

# Deberías ver:
# ┌─────┬────────────────────┬─────────┬─────────┬──────────┐
# │ id  │ name               │ status  │ restart │ uptime   │
# ├─────┼────────────────────┼─────────┼─────────┼──────────┤
# │ 0   │ cruzimex-backend   │ online  │ 0       │ 0s       │
# └─────┴────────────────────┴─────────┴─────────┴──────────┘

# Ver logs en tiempo real
pm2 logs cruzimex-backend

# Salir de logs: Ctrl+C

# Guardar configuración de PM2
pm2 save

# Configurar inicio automático
pm2 startup
```

### Paso 2: Iniciar NGINX

```cmd
cd C:\nginx\nginx

# Iniciar NGINX
start nginx

# Verificar que está corriendo
tasklist /fi "imagename eq nginx.exe"
```

### Paso 3: Abrir Puertos en Firewall

**Método 1: Interfaz Gráfica**

1. Abrir **"Firewall de Windows Defender con seguridad avanzada"**
2. Click en **"Reglas de entrada"** → **"Nueva regla"**

**Para Puerto 80:**

- Tipo: **"Puerto"**
- Protocolo: **TCP**
- Puerto: **80**
- Acción: **"Permitir la conexión"**
- Perfil: Todos marcados
- Nombre: **"HTTP - Sistema Cruzimex"**

**Para Puerto 443:**

- Repetir proceso con puerto **443**
- Nombre: **"HTTPS - Sistema Cruzimex"**

**Método 2: Línea de Comandos**

```cmd
# Abrir PowerShell como administrador

# Permitir puerto 80
netsh advfirewall firewall add rule name="HTTP Cruzimex" dir=in action=allow protocol=TCP localport=80

# Permitir puerto 443
netsh advfirewall firewall add rule name="HTTPS Cruzimex" dir=in action=allow protocol=TCP localport=443

# Verificar reglas
netsh advfirewall firewall show rule name="HTTP Cruzimex"
netsh advfirewall firewall show rule name="HTTPS Cruzimex"
```

### Paso 4: Probar el Sistema

**Desde el Servidor:**

1. Abrir navegador
2. Ir a: `http://localhost`
3. Deberías ver: Pantalla principal del sistema (formulario de vendedor)

**Dashboard Administrativo:**

- URL: `http://localhost/api/index`
- Ingresar código de administrador configurado

**Desde otra PC en la red:**

1. Obtener IP del servidor:

   ```cmd
   ipconfig
   # Anotar la IPv4 Address
   ```

2. En otra PC, abrir navegador:
   - URL: `http://IP_DEL_SERVIDOR`
   - Ejemplo: `http://192.168.1.100`

### Paso 5: Verificar Backend API

```cmd
# Probar endpoint de test
curl http://localhost:3001/api/test

# O desde navegador:
http://localhost:3001/api/test

# Deberías ver JSON con información del API
```

### Paso 6: Probar Sincronización de Google Sheets

1. Acceder al dashboard administrativo: `http://localhost/api/index`
2. Ingresar código de administrador
3. Click en **"Sincronizar Google Sheets"**
4. Click en botón **AZUL** ("Sincronizar Ahora")
5. Verificar que se sincronicen los datos correctamente

✅ **Sistema funcionando correctamente**

---

## 9. Configuración como Servicio Windows

### Paso 1: NGINX como Servicio

Instalar **NSSM** (Non-Sucking Service Manager):

```cmd
# Descargar NSSM
# Ir a: https://nssm.cc/download
# Descargar: nssm-2.24.zip

# Extraer a: C:\nssm\

# Instalar NGINX como servicio
cd C:\nssm

nssm install nginx "C:\nginx\nginx\nginx.exe"

# Configurar servicio
nssm set nginx AppDirectory "C:\nginx\nginx"
nssm set nginx DisplayName "NGINX - Cruzimex"
nssm set nginx Description "Servidor web NGINX para Sistema de Bajas Cruzimex"
nssm set nginx Start SERVICE_AUTO_START

# Iniciar servicio
nssm start nginx

# Verificar estado
nssm status nginx
```

**Verificar en Servicios:**

1. Abrir **"Servicios"** (services.msc)
2. Buscar: **"NGINX - Cruzimex"**
3. Verificar:
   - Estado: **"En ejecución"**
   - Tipo de inicio: **"Automático"**

### Paso 2: Configurar Reinicio Automático

**Para PM2:**

1. Abrir **"Servicios"** (services.msc)
2. Buscar: **"PM2"**
3. Clic derecho → **"Propiedades"**
4. Pestaña **"Recuperación"**:
   - Primer error: **"Reiniciar el servicio"**
   - Segundo error: **"Reiniciar el servicio"**
   - Errores siguientes: **"Reiniciar el servicio"**
   - Reiniciar servicio tras: **1 minuto**
5. Click **"Aplicar"** → **"Aceptar"**

**Para NGINX:**

Repetir el mismo proceso con el servicio "NGINX - Cruzimex"

✅ **Servicios configurados para inicio automático**

---

## 10. Configuración de SSL (HTTPS)

### Opción A: Certificado Auto-firmado (Desarrollo/Interno)

```cmd
# Instalar OpenSSL para Windows
# Descargar de: https://slproweb.com/products/Win32OpenSSL.html

# Crear carpeta para certificados
mkdir C:\nginx\nginx\ssl
cd C:\nginx\nginx\ssl

# Generar certificado auto-firmado
"C:\Program Files\OpenSSL-Win64\bin\openssl.exe" req -x509 -nodes -days 365 -newkey rsa:2048 -keyout cruzimex.key -out cruzimex.crt

# Completar información cuando se solicite:
# Country: BO
# State: [Tu departamento]
# City: [Tu ciudad]
# Organization: Cruzimex Ltda.
# Common Name: [IP o dominio del servidor]
# Email: sistemas@cruzimex.com
```

**Actualizar nginx.conf:**

```nginx
# Agregar servidor HTTPS
server {
    listen       443 ssl;
    server_name  TU_IP_O_DOMINIO;

    # Certificados SSL
    ssl_certificate      ssl/cruzimex.crt;
    ssl_certificate_key  ssl/cruzimex.key;

    # Configuración SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Resto de configuración igual que el servidor HTTP
    location / {
        root   C:/inetpub/cruzimex/SistemaDeBajas/frontend/dist;
        index  index.html;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Redirigir HTTP a HTTPS
server {
    listen 80;
    server_name TU_IP_O_DOMINIO;
    return 301 https://$server_name$request_uri;
}
```

### Opción B: Certificado Let's Encrypt (Producción)

Para dominio público, usar **win-acme**:

```cmd
# Descargar win-acme
# Ir a: https://www.win-acme.com/
# Descargar última versión

# Extraer a: C:\win-acme\

# Ejecutar
cd C:\win-acme
wacs.exe

# Seguir el asistente:
# 1. Seleccionar: "Create new certificate"
# 2. Tipo: "Single binding of an IIS site"
# 3. Ingresar dominio: bajas.cruzimex.com
# 4. Validación: HTTP validation
# 5. Instalar: En NGINX
```

✅ **SSL/HTTPS configurado**

---

## 11. Monitoreo y Logs

### Ubicaciones de Logs

```cmd
# Logs de NGINX
C:\nginx\nginx\logs\access.log
C:\nginx\nginx\logs\error.log
C:\nginx\nginx\logs\cruzimex-access.log
C:\nginx\nginx\logs\cruzimex-error.log

# Logs de la aplicación (Backend)
C:\inetpub\cruzimex\SistemaDeBajas\backend\logs\app.log
C:\inetpub\cruzimex\SistemaDeBajas\backend\logs\sync.log

# Logs de PM2
C:\ProgramData\pm2\home\logs\
```

### Comandos para Ver Logs

```cmd
# Ver últimas líneas de log de NGINX (error)
powershell -command "Get-Content C:\nginx\nginx\logs\error.log -Tail 50"

# Ver log de aplicación en tiempo real
pm2 logs cruzimex-backend

# Ver últimas líneas de log de aplicación
pm2 logs cruzimex-backend --lines 100

# Ver logs de todas las apps de PM2
pm2 logs
```

### Script de Monitoreo

Crear: `C:\inetpub\cruzimex\monitor.bat`

```batch
@echo off
echo ========================================
echo   Monitor del Sistema - Cruzimex
echo ========================================
echo.

echo Verificando servicios...
echo.

echo [MySQL]
sc query MySQL80 | find "RUNNING"
if errorlevel 1 (echo DETENIDO - ERROR!) else (echo OK)
echo.

echo [PM2]
sc query PM2 | find "RUNNING"
if errorlevel 1 (echo DETENIDO - ERROR!) else (echo OK)
echo.

echo [NGINX]
tasklist /fi "imagename eq nginx.exe" | find "nginx.exe"
if errorlevel 1 (echo DETENIDO - ERROR!) else (echo OK)
echo.

echo Verificando puertos...
echo.

echo [Puerto 80 - HTTP]
netstat -an | find ":80 "
echo.

echo [Puerto 3001 - Backend]
netstat -an | find ":3001 "
echo.

echo [Puerto 3306 - MySQL]
netstat -an | find ":3306 "
echo.

pause
```

### Configurar Rotación de Logs

Crear script: `C:\inetpub\cruzimex\rotate-logs.ps1`

```powershell
# Script de rotación de logs

$fecha = Get-Date -Format "yyyyMMdd"
$logsPath = "C:\nginx\nginx\logs"

# Rotar logs de NGINX
if (Test-Path "$logsPath\access.log") {
    Copy-Item "$logsPath\access.log" "$logsPath\access-$fecha.log"
    Clear-Content "$logsPath\access.log"
}

if (Test-Path "$logsPath\error.log") {
    Copy-Item "$logsPath\error.log" "$logsPath\error-$fecha.log"
    Clear-Content "$logsPath\error.log"
}

# Eliminar logs antiguos (más de 30 días)
Get-ChildItem $logsPath -Filter "*.log" |
    Where-Object { $_.Name -match "\d{8}" -and $_.LastWriteTime -lt (Get-Date).AddDays(-30) } |
    Remove-Item

Write-Host "Logs rotados exitosamente"
```

**Programar tarea en Task Scheduler:**

```cmd
# Abrir Task Scheduler
taskschd.msc

# Crear nueva tarea:
# - Nombre: "Rotar Logs Cruzimex"
# - Trigger: Diario a las 00:00
# - Acción: powershell.exe -ExecutionPolicy Bypass -File "C:\inetpub\cruzimex\rotate-logs.ps1"
```

✅ **Monitoreo configurado**

---

## 12. Troubleshooting

### Problema: NGINX no inicia

**Síntomas:**

- No se puede acceder a http://localhost
- nginx.exe no aparece en tasklist

**Soluciones:**

```cmd
# 1. Verificar configuración
cd C:\nginx\nginx
nginx -t

# 2. Ver logs de error
type logs\error.log

# 3. Verificar puerto 80 libre
netstat -ano | find ":80"

# Si está ocupado, encontrar proceso:
tasklist /fi "pid eq [PID]"

# 4. Intentar iniciar manualmente
nginx

# Ver errores en pantalla
```

### Problema: Backend no responde

**Síntomas:**

- Frontend carga pero API no funciona
- Error 502 Bad Gateway

**Soluciones:**

```cmd
# 1. Verificar estado de PM2
pm2 status

# Si está "errored":
pm2 restart cruzimex-backend

# 2. Ver logs
pm2 logs cruzimex-backend --lines 100

# 3. Verificar puerto 3001
netstat -ano | find ":3001"

# 4. Verificar .env
cd C:\inetpub\cruzimex\SistemaDeBajas\backend
type .env

# 5. Probar backend directamente
curl http://localhost:3001/api/test

# O en navegador:
http://localhost:3001/api/test
```

### Problema: MySQL no conecta

**Síntomas:**

- Backend muestra error de conexión a BD
- Error: "ECONNREFUSED 3306"

**Soluciones:**

```cmd
# 1. Verificar servicio MySQL
sc query MySQL80

# Si está detenido:
net start MySQL80

# 2. Probar conexión
mysql -u root -p

# 3. Verificar usuario y permisos
mysql -u root -p
SHOW GRANTS FOR 'cruzimex_user'@'localhost';

# 4. Verificar puerto 3306
netstat -ano | find ":3306"

# 5. Verificar credenciales en .env
type C:\inetpub\cruzimex\SistemaDeBajas\backend\.env
```

### Problema: Fotos no se suben

**Síntomas:**

- Error al intentar subir fotos
- "File upload failed"

**Soluciones:**

```cmd
# 1. Verificar carpeta uploads existe
dir C:\inetpub\cruzimex\SistemaDeBajas\backend\uploads

# Si no existe, crear:
mkdir C:\inetpub\cruzimex\SistemaDeBajas\backend\uploads

# 2. Verificar permisos de carpeta
# Clic derecho en carpeta uploads → Propiedades → Seguridad
# Agregar permisos de "Modificar" para "Users"

# 3. Verificar tamaño máximo en nginx.conf
# Buscar: client_max_body_size 25M;

# 4. Reiniciar NGINX
nginx -s reload
```

### Problema: Sincronización Google Sheets falla

**Síntomas:**

- Error al sincronizar
- "Cannot fetch Google Sheets"

**Soluciones:**

```cmd
# 1. Verificar URL en .env
type C:\inetpub\cruzimex\SistemaDeBajas\backend\.env | find "GOOGLE_SHEET_URL"

# 2. Probar script de test
cd C:\inetpub\cruzimex\SistemaDeBajas\backend
node scripts/testGoogleSheets.js

# 3. Verificar que Google Sheet sea público
# Ir al Google Sheet → Compartir → "Anyone with the link can view"

# 4. Verificar formato de URL
# Debe terminar en: /export?format=csv

# 5. Ver logs de sincronización
type logs\sync.log
```

---

## 13. Mantenimiento

### Backup de Base de Datos

**Script de backup automático:**

Crear: `C:\inetpub\cruzimex\backup-db.bat`

```batch
@echo off
REM Backup de base de datos MySQL

SET fecha=%date:~-4%%date:~3,2%%date:~0,2%
SET hora=%time:~0,2%%time:~3,2%
SET hora=%hora: =0%

SET backup_dir=C:\inetpub\cruzimex\backups\mysql
SET backup_file=%backup_dir%\sistema_bajas_%fecha%_%hora%.sql

REM Crear directorio si no existe
if not exist "%backup_dir%" mkdir "%backup_dir%"

REM Ejecutar backup
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe" -u root -p[PASSWORD] sistema_bajas > "%backup_file%"

REM Comprimir
powershell -command "Compress-Archive -Path '%backup_file%' -DestinationPath '%backup_file%.zip'"
del "%backup_file%"

REM Eliminar backups antiguos (más de 30 días)
forfiles /p "%backup_dir%" /m *.zip /d -30 /c "cmd /c del @file"

echo Backup completado: %backup_file%.zip
```

⚠️ **Importante:** Reemplazar `[PASSWORD]` con la contraseña real de MySQL

**Programar en Task Scheduler:**

```cmd
# Crear tarea:
# - Nombre: "Backup BD Cruzimex"
# - Trigger: Diario a las 02:00 AM
# - Acción: C:\inetpub\cruzimex\backup-db.bat
```

### Actualización del Sistema

**Pasos para actualizar:**

```cmd
# 1. Hacer backup de base de datos
C:\inetpub\cruzimex\backup-db.bat

# 2. Detener servicios
pm2 stop cruzimex-backend
nginx -s stop

# 3. Hacer backup de archivos
cd C:\inetpub\cruzimex
powershell -command "Compress-Archive -Path 'SistemaDeBajas' -DestinationPath 'backup_sistema_%date:~-4%%date:~3,2%%date:~0,2%.zip'"

# 4. Actualizar código
cd SistemaDeBajas
git pull origin main

# 5. Actualizar dependencias backend
cd backend
npm install --production

# 6. Rebuild frontend
cd ..\frontend
npm install
npm run build

# 7. Reiniciar servicios
cd C:\inetpub\cruzimex\SistemaDeBajas\backend
pm2 restart cruzimex-backend

cd C:\nginx\nginx
start nginx

# 8. Verificar sistema
http://localhost
```

### Limpieza de Archivos Temporales

```cmd
# Limpiar logs antiguos de PM2
pm2 flush

# Limpiar archivos temporales de NGINX
del C:\nginx\nginx\temp\* /Q

# Limpiar cache de npm (si es necesario)
npm cache clean --force
```

### Monitoreo de Recursos

```cmd
# Ver uso de CPU y memoria
tasklist /FI "IMAGENAME eq nginx.exe" /FO TABLE
tasklist /FI "IMAGENAME eq node.exe" /FO TABLE

# Monitor de rendimiento
perfmon
```

---

## ✅ Checklist Final de Deployment

- [ ] MySQL instalado y corriendo
- [ ] Node.js y npm instalados
- [ ] NGINX instalado y configurado
- [ ] PM2 instalado como servicio
- [ ] Repositorio clonado en `C:\inetpub\cruzimex\SistemaDeBajas\`
- [ ] Dependencias backend instaladas
- [ ] Archivo `.env` configurado correctamente
- [ ] Hash de administrador generado
- [ ] Base de datos inicializada
- [ ] Migración ejecutada
- [ ] Frontend compilado (npm run build)
- [ ] Configuración de NGINX actualizada
- [ ] Puertos 80 y 443 abiertos en Firewall
- [ ] Backend corriendo con PM2
- [ ] NGINX corriendo
- [ ] Sistema accesible desde navegador
- [ ] Dashboard administrativo funcional (/api/index)
- [ ] Sincronización Google Sheets funcional
- [ ] NGINX configurado como servicio
- [ ] PM2 configurado para inicio automático
- [ ] Backups automáticos configurados
- [ ] Rotación de logs configurada
- [ ] SSL/HTTPS configurado (opcional)

---

## 📞 Soporte

Si encuentras problemas durante el deployment:

1. Revisar logs:

   - NGINX: `C:\nginx\nginx\logs\error.log`
   - Backend: `pm2 logs cruzimex-backend`
   - MySQL: Visor de eventos de Windows

2. Ejecutar script de monitoreo:

   ```cmd
   C:\inetpub\cruzimex\monitor.bat
   ```

3. Contactar al desarrollador:
   - **Ludwing Julian Herrera Justiniano**
   - Email: sistemas@cruzimex.com

---

**Guía desarrollada por Ludwing Julian Herrera Justiniano para Cruzimex Ltda.**

**Versión:** 1.0
**Última actualización:** Noviembre 2024
