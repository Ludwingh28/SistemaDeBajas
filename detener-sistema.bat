@echo off
title Detener Sistema - Cruzimex
color 0C
cls

echo ========================================
echo   Sistema de Bajas - Cruzimex Ltda.
echo   Deteniendo Servicios
echo ========================================
echo.

REM ====================================
REM DETENER PM2
REM ====================================
echo [1/3] Deteniendo PM2 Backend...
pm2 stop all 2>nul
pm2 save
echo    [OK] PM2 detenido y configuracion guardada
timeout /t 2 /nobreak >nul
echo.

REM ====================================
REM DETENER NGINX
REM ====================================
echo [2/3] Deteniendo NGINX...
cd /d C:\nginx
nginx.exe -s quit 2>nul
timeout /t 2 /nobreak >nul

REM Si no se detuvo gracefully, forzar
tasklist | findstr nginx.exe >nul
if %errorlevel% == 0 (
    taskkill /F /IM nginx.exe >nul 2>&1
    echo    [OK] NGINX detenido (forzado)
) else (
    echo    [OK] NGINX detenido correctamente
)
echo.

REM ====================================
REM LIMPIAR PROCESOS HUERFANOS
REM ====================================
echo [3/3] Limpiando procesos huerfanos...
taskkill /F /IM node.exe 2>nul
echo    [OK] Procesos huerfanos eliminados
echo.

REM ====================================
REM VERIFICACION FINAL
REM ====================================
echo ========================================
echo   VERIFICACION FINAL
echo ========================================
echo.

tasklist | findstr nginx.exe >nul
if %errorlevel% == 1 (
    echo [OK] NGINX: Detenido
) else (
    echo [X] NGINX: Aun corriendo
)

pm2 list | findstr "online" >nul
if %errorlevel% == 1 (
    echo [OK] PM2: Detenido
) else (
    echo [X] PM2: Aun corriendo
)

echo.
echo ========================================
echo   SISTEMA DETENIDO
echo ========================================
echo.
pause
