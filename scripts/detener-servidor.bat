@echo off
chcp 65001 >nul
title Detener Servidor SST/SIHO
color 0c

echo =====================================================================
echo    DETENER SERVIDOR SST/SIHO
echo =====================================================================
echo.
echo Deteniendo el servicio en segundo plano...

powershell -Command "Stop-ScheduledTask -TaskName 'SistemaCronogramasSST' -ErrorAction SilentlyContinue; Get-NetTCPConnection -LocalPort 80,3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }; Stop-Process -Name 'bun','node' -Force -ErrorAction SilentlyContinue; taskkill /F /IM bun.exe /IM node.exe >nul 2>&1"

echo.
echo [OK] Servidor detenido exitosamente y puertos 80/3000 liberados.
echo.
pause
