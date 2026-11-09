@echo off
chcp 65001 >nul
title Actualizar Sistema SST/SIHO
echo =====================================================================
echo    Actualizar Sistema de Cronogramas SST/SIHO desde GitHub
echo =====================================================================
echo.

cd /d "%~dp0\.."

echo [1/6] Descargando ultimos cambios de GitHub...
git pull
if errorlevel 1 (
    echo.
    echo [ERROR] Falló 'git pull'. Verifique la conexión a Internet o credenciales.
    echo.
    pause
    exit /b 1
)

echo.
echo [2/6] Verificando dependencias de software...
call bun install

echo.
echo [3/6] Verificando migraciones de base de datos...
call bun run db:migrate 2>nul

echo.
echo [4/6] Sincronizando catálogo de formularios en base de datos...
call bun run db:cargar-formularios

echo.
echo [5/6] Recompilando la aplicación para producción...
call bun run build
if errorlevel 1 (
    echo.
    echo [ERROR] Error durante la compilación.
    pause
    exit /b 1
)

echo.
echo [6/6] Reiniciando servidor automáticamente con los nuevos cambios...
powershell -Command "$t = Get-ScheduledTask -TaskName 'SistemaCronogramasSST' -ErrorAction SilentlyContinue; if ($t) { Stop-ScheduledTask -TaskName 'SistemaCronogramasSST' -ErrorAction SilentlyContinue; Start-Sleep -Seconds 2; Start-ScheduledTask -TaskName 'SistemaCronogramasSST'; Write-Host '[OK] Tarea del servidor reiniciada exitosamente.' } else { Get-Process -Name 'bun' -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -match 'start' } | Stop-Process -Force -ErrorAction SilentlyContinue; Start-Process -FilePath 'bun' -ArgumentList 'run start' -WorkingDirectory '%~dp0..' -WindowStyle Minimized; Write-Host '[OK] Servidor reiniciado en segundo plano.' }"

echo.
echo =====================================================================
echo    ¡Actualización completada con éxito!
echo    El servidor ya está corriendo con la nueva versión.
echo    Puedes recargar la página en el navegador.
echo =====================================================================
echo.
pause
