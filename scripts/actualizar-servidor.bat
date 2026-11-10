@echo off
chcp 65001 >nul
title Actualizar Sistema SST/SIHO
echo =====================================================================
echo    Actualizar Sistema de Cronogramas SST/SIHO desde GitHub
echo =====================================================================
echo.

cd /d "%~dp0\.."

echo [1/6] Descargando ultimos cambios de GitHub...
git pull origin main
if errorlevel 1 (
    echo.
    echo [ERROR] Falló 'git pull'. Verifique la conexión a Internet o credenciales.
    echo.
    pause
    exit /b 1
)

echo.
echo [2/6] Verificando dependencias de software...
where bun >nul 2>nul
if %errorlevel% equ 0 (
    call bun install
) else (
    call npm install
)

echo.
echo [3/6] Verificando migraciones de base de datos...
where bun >nul 2>nul
if %errorlevel% equ 0 (
    call bun run db:migrar-superadmin
) else (
    call npm run db:migrar-superadmin
)

echo.
echo [4/6] Sincronizando catálogo de formularios en base de datos...
where bun >nul 2>nul
if %errorlevel% equ 0 (
    call bun run db:cargar-formularios
) else (
    call npm run db:cargar-formularios
)

echo.
echo [5/6] Recompilando la aplicación para producción...
where bun >nul 2>nul
if %errorlevel% equ 0 (
    call bun run build
) else (
    call npm run build
)
if errorlevel 1 (
    echo.
    echo [ERROR] Error durante la compilación.
    echo.
    pause
    exit /b 1
)

echo.
echo [6/6] Reiniciando servidor automáticamente con los nuevos cambios...
powershell -ExecutionPolicy Bypass -Command "Start-Process 'wscript.exe' -ArgumentList '\"%~dp0iniciar-segundo-plano.vbs\"' -WorkingDirectory '%~dp0..'"

echo.
echo =====================================================================
echo    ¡Actualización completada con éxito!
echo    El servidor ya está corriendo con la nueva versión en segundo plano.
echo    Puedes recargar la página en el navegador.
echo =====================================================================
echo.
pause
