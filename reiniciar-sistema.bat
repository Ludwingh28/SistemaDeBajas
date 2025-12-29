@echo off
title Reiniciar Sistema Cruzimex
color 0A
cls

echo ========================================
echo   Sistema de Bajas - Cruzimex Ltda.
echo   Reinicio Completo del Sistema
echo ========================================
echo.

REM ====================================
REM 1. MATAR TODAS LAS INSTANCIAS DE NGINX
REM ====================================
echo [1/4] Deteniendo todas las instancias de NGINX...
taskkill /F /IM nginx.exe 2>nul
if %errorlevel% == 0 (
    echo    [OK] NGINX detenido correctamente
) else (
    echo    [INFO] No habia instancias de NGINX corriendo
)
timeout /t 2 /nobreak >nul
echo.

REM ====================================
REM 2. MATAR TODAS LAS INSTANCIAS DE PM2 Y NODE
REM ====================================
echo [2/4] Deteniendo todas las instancias de PM2 y Node.js...

REM Detener todos los procesos de PM2
pm2 kill 2>nul
if %errorlevel% == 0 (
    echo    [OK] PM2 detenido correctamente
) else (
    echo    [INFO] No habia instancias de PM2 corriendo
)

REM Matar procesos huerfanos de Node.js
taskkill /F /IM node.exe 2>nul
if %errorlevel% == 0 (
    echo    [OK] Procesos huerfanos de Node.js eliminados
) else (
    echo    [INFO] No habia procesos huerfanos de Node.js
)

REM Matar procesos huerfanos de PM2
taskkill /F /IM pm2.exe 2>nul

timeout /t 3 /nobreak >nul
echo.

REM ====================================
REM 3. INICIAR NGINX
REM ====================================
echo [3/4] Iniciando NGINX...
cd /d C:\nginx
start "NGINX - Sistema Cruzimex" cmd /k "color 0B && echo NGINX - Sistema de Bajas Cruzimex && echo ===================================== && echo NGINX iniciado correctamente && echo Logs en tiempo real: && echo. && nginx.exe && tail -f logs/cruzimex-error.log 2>nul || echo Esperando logs..."
timeout /t 2 /nobreak >nul

REM Verificar que NGINX inicio correctamente
tasklist | findstr nginx.exe >nul
if %errorlevel% == 0 (
    echo    [OK] NGINX iniciado correctamente
) else (
    echo    [ERROR] NGINX no se pudo iniciar - Revisar configuracion
    pause
    exit /b 1
)
echo.

REM ====================================
REM 4. INICIAR PM2 BACKEND
REM ====================================
echo [4/4] Iniciando PM2 Backend...
cd /d C:\inetpub\cruzimex\SistemaDeBajas\backend

REM Restaurar procesos guardados de PM2
pm2 resurrect 2>nul

REM Si no habia procesos guardados, iniciar desde cero
pm2 list | findstr "backend-cruzimex" >nul
if %errorlevel% == 1 (
    echo    [INFO] No hay procesos guardados, iniciando backend desde cero...
    pm2 start index.js --name "backend-cruzimex"
)

REM Guardar configuracion
pm2 save

REM Abrir ventana con logs de PM2
start "PM2 Backend - Sistema Cruzimex" cmd /k "color 0E && cd /d C:\inetpub\cruzimex\SistemaDeBajas\backend && echo PM2 Backend - Sistema de Bajas Cruzimex && echo ===================================== && pm2 list && echo. && echo Logs en tiempo real: && echo. && pm2 logs backend-cruzimex"

timeout /t 2 /nobreak >nul

REM Verificar que PM2 inicio correctamente
pm2 list | findstr "online" >nul
if %errorlevel% == 0 (
    echo    [OK] PM2 Backend iniciado correctamente
) else (
    echo    [ERROR] PM2 no se pudo iniciar - Revisar logs
    pause
    exit /b 1
)
echo.

REM ====================================
REM RESUMEN FINAL
REM ====================================
echo ========================================
echo   SISTEMA REINICIADO EXITOSAMENTE
echo ========================================
echo.
echo Estado de servicios:
echo.

REM Verificar NGINX
tasklist | findstr nginx.exe >nul
if %errorlevel% == 0 (
    echo [OK] NGINX: Corriendo
) else (
    echo [X] NGINX: Detenido
)

REM Verificar PM2
pm2 list | findstr "online" >nul
if %errorlevel% == 0 (
    echo [OK] PM2: Corriendo
) else (
    echo [X] PM2: Detenido
)

echo.
echo Se han abierto 2 ventanas de consola:
echo  - Ventana AZUL: Logs de NGINX
echo  - Ventana AMARILLA: Logs de PM2 Backend
echo.
echo Puedes cerrar esta ventana o presionar cualquier tecla.
echo.
pause
exit
