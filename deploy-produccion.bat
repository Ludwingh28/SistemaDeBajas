@echo off
title Deploy a Produccion - Cruzimex
color 0C
cls

echo ========================================
echo   Sistema de Bajas - Cruzimex Ltda.
echo   Deploy a Produccion
echo ========================================
echo.

REM ====================================
REM RUTAS
REM ====================================
set RUTA_DESARROLLO=C:\Users\ludwi\OneDrive\Escritorio\kj\Cruzimex\SistemaDeBajas
set RUTA_PRODUCCION=C:\inetpub\cruzimex\SistemaDeBajas

echo Ruta Desarrollo: %RUTA_DESARROLLO%
echo Ruta Produccion: %RUTA_PRODUCCION%
echo.

REM ====================================
REM CONFIRMACION
REM ====================================
echo ADVERTENCIA: Esta operacion copiara archivos a produccion
echo.
set /p CONFIRMAR="Estas seguro de continuar? (S/N): "
if /i not "%CONFIRMAR%"=="S" (
    echo.
    echo Operacion cancelada.
    pause
    exit /b 0
)
echo.

REM ====================================
REM 1. CONSTRUIR FRONTEND
REM ====================================
echo [1/4] Construyendo frontend...
cd /d %RUTA_DESARROLLO%\frontend
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Error al construir el frontend
    pause
    exit /b 1
)
echo    [OK] Frontend construido
echo.

REM ====================================
REM 2. COPIAR BACKEND
REM ====================================
echo [2/4] Copiando archivos del backend...

REM Crear directorio si no existe
if not exist "%RUTA_PRODUCCION%\backend" mkdir "%RUTA_PRODUCCION%\backend"

REM Copiar archivos del backend (excluyendo node_modules y uploads)
xcopy /E /I /Y "%RUTA_DESARROLLO%\backend\*.js" "%RUTA_PRODUCCION%\backend\" >nul
xcopy /E /I /Y "%RUTA_DESARROLLO%\backend\*.json" "%RUTA_PRODUCCION%\backend\" >nul
xcopy /E /I /Y "%RUTA_DESARROLLO%\backend\.env" "%RUTA_PRODUCCION%\backend\" >nul 2>nul
xcopy /E /I /Y "%RUTA_DESARROLLO%\backend\routes" "%RUTA_PRODUCCION%\backend\routes\" >nul
xcopy /E /I /Y "%RUTA_DESARROLLO%\backend\models" "%RUTA_PRODUCCION%\backend\models\" >nul
xcopy /E /I /Y "%RUTA_DESARROLLO%\backend\middleware" "%RUTA_PRODUCCION%\backend\middleware\" >nul
xcopy /E /I /Y "%RUTA_DESARROLLO%\backend\services" "%RUTA_PRODUCCION%\backend\services\" >nul
xcopy /E /I /Y "%RUTA_DESARROLLO%\backend\config" "%RUTA_PRODUCCION%\backend\config\" >nul

echo    [OK] Backend copiado
echo.

REM ====================================
REM 3. COPIAR FRONTEND
REM ====================================
echo [3/4] Copiando frontend...

REM Crear directorio si no existe
if not exist "%RUTA_PRODUCCION%\frontend\dist" mkdir "%RUTA_PRODUCCION%\frontend\dist"

REM Copiar dist completo
xcopy /E /I /Y "%RUTA_DESARROLLO%\frontend\dist" "%RUTA_PRODUCCION%\frontend\dist\" >nul

echo    [OK] Frontend copiado
echo.

REM ====================================
REM 4. INSTALAR DEPENDENCIAS
REM ====================================
echo [4/4] Verificando dependencias de produccion...
cd /d %RUTA_PRODUCCION%\backend

REM Verificar si existe node_modules
if not exist "node_modules" (
    echo    [INFO] Instalando dependencias del backend...
    call npm install --production
    if %errorlevel% neq 0 (
        echo    [ERROR] Error instalando dependencias
        pause
        exit /b 1
    )
    echo    [OK] Dependencias instaladas
) else (
    echo    [OK] Dependencias ya instaladas
)
echo.

REM ====================================
REM RESUMEN
REM ====================================
echo ========================================
echo   DEPLOY COMPLETADO
echo ========================================
echo.
echo Archivos copiados a: %RUTA_PRODUCCION%
echo.
echo Siguiente paso:
echo  - Ejecuta reiniciar-sistema.bat para aplicar cambios
echo.
pause
