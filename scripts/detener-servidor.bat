@echo off
chcp 65001 >nul
title Detener Servidor SST/SIHO
color 0c

echo =====================================================================
echo    DETENER SERVIDOR SST/SIHO
echo =====================================================================
echo.
echo Deteniendo el servicio en segundo plano...

powershell -Command "Stop-ScheduledTask -TaskName 'SistemaCronogramasSST' -ErrorAction SilentlyContinue; Get-Process -Name 'bun' -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -match 'start' } | Stop-Process -Force -ErrorAction SilentlyContinue; taskkill /F /IM bun.exe >nul 2>&1"

echo.
echo [OK] Servidor detenido exitosamente.
echo.
pause
