@echo off
title Estado del Sistema - Cruzimex
color 0B
cls

echo ========================================
echo   Sistema de Bajas - Cruzimex Ltda.
echo   Estado de Servicios
echo ========================================
echo.

REM ====================================
REM VERIFICAR NGINX
REM ====================================
echo [NGINX]
tasklist | findstr nginx.exe >nul
if %errorlevel% == 0 (
    echo Estado: [OK] Corriendo
    echo Procesos activos:
    tasklist | findstr nginx.exe
) else (
    echo Estado: [X] Detenido
)
echo.

REM ====================================
REM VERIFICAR PM2
REM ====================================
echo [PM2 Backend]
pm2 list 2>nul | findstr "backend-cruzimex" >nul
if %errorlevel% == 0 (
    echo Estado: [OK] Corriendo
    echo.
    pm2 list
) else (
    echo Estado: [X] Detenido o no configurado
)
echo.

REM ====================================
REM VERIFICAR PROCESOS HUERFANOS
REM ====================================
echo [Procesos Huerfanos]
echo.
tasklist | findstr node.exe | findstr /V "pm2" >nul
if %errorlevel% == 0 (
    echo [ADVERTENCIA] Hay procesos huerfanos de Node.js:
    tasklist | findstr node.exe
    echo.
    echo Ejecuta reiniciar-sistema.bat para limpiar
) else (
    echo [OK] No hay procesos huerfanos
)
echo.

REM ====================================
REM PROBAR CONECTIVIDAD
REM ====================================
echo [Prueba de Conectividad]
echo.
echo Probando NGINX (puerto 80)...
netstat -ano | findstr ":80 " | findstr "LISTENING" >nul
if %errorlevel% == 0 (
    echo [OK] Puerto 80 escuchando
) else (
    echo [X] Puerto 80 no escuchando
)

echo.
echo Probando Backend (puerto 3001)...
netstat -ano | findstr ":3001 " | findstr "LISTENING" >nul
if %errorlevel% == 0 (
    echo [OK] Puerto 3001 escuchando
) else (
    echo [X] Puerto 3001 no escuchando
)

echo.
echo ========================================
echo   Accesos al Sistema:
echo ========================================
echo.
echo Frontend (Vendedores): http://localhost/
echo Dashboard Admin: http://localhost/admin
echo.
echo ========================================
pause
