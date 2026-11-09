@echo off
chcp 65001 >nul
title Configurar Sistema SST/SIHO 24/7 en Windows
color 0b

echo =====================================================================
echo    CONFIGURAR SISTEMA SST/SIHO 24/7 EN LA MÁQUINA VIRTUAL
echo =====================================================================
echo.
echo Este asistente programa Windows para que:
echo 1. El SERVIDOR WEB arranque SOLO al encender o reiniciar la máquina.
echo    (No requiere abrir ventanas ni iniciar sesión de usuario).
echo 2. El AUTO-ACTUALIZADOR revise GitHub cada 5 minutos silenciosamente.
echo    (Al detectar un git push desde tu laptop, actualiza y reinicia solo).
echo.

set "SCRIPT_PS1=%~dp0instalar-servicio.ps1"

echo  [1] Activar Sistema 24/7 (Arranque con Windows + Auto-Actualizaciones)
echo  [2] Desactivar Sistema 24/7 (Eliminar tareas programadas)
echo  [3] Salir
echo.

set /p OPCION="Seleccione una opción (1, 2 o 3): "

if "%OPCION%"=="1" goto ACTIVAR
if "%OPCION%"=="2" goto DESACTIVAR
goto SALIR

:ACTIVAR
echo.
echo Registrando servicios en Windows...
powershell -ExecutionPolicy Bypass -File "%SCRIPT_PS1%" -Accion activar
pause
exit /b 0

:DESACTIVAR
echo.
echo Desactivando servicios de Windows...
powershell -ExecutionPolicy Bypass -File "%SCRIPT_PS1%" -Accion desactivar
pause
exit /b 0

:SALIR
exit /b 0
