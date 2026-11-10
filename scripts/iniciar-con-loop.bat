@echo off
chcp 65001 >nul
title Servidor SST/SIHO (24/7 Watchdog)
cd /d "%~dp0\.."

:LOOP
echo [%date% %time%] Iniciando servidor SST/SIHO en puerto 8030...
call npm run start
echo [%date% %time%] El servidor se detuvo inesperadamente. Reiniciando en 5 segundos...
timeout /t 5 /nobreak >nul
goto LOOP
