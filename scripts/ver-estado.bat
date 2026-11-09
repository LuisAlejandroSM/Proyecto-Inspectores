@echo off
chcp 65001 >nul
title Estado del Servidor SST/SIHO
color 0a

echo =====================================================================
echo    ESTADO DEL SERVIDOR SST/SIHO EN SEGUNDO PLANO
echo =====================================================================
echo.

powershell -ExecutionPolicy Bypass -Command "& { $task = Get-ScheduledTask -TaskName 'SistemaCronogramasSST' -ErrorAction SilentlyContinue; if ($task) { Write-Host ('[TAREA 24/7] ' + $task.TaskName + ' -> Estado: ' + $task.State) -ForegroundColor Cyan }; $p = Get-Process -Name 'bun','node' -ErrorAction SilentlyContinue; if ($p) { Write-Host '[ACTIVO] El servidor web está corriendo en segundo plano.' -ForegroundColor Green; Write-Host ('[MEMORIA] ' + [math]::Round(($p | Measure-Object -Property WorkingSet64 -Sum).Sum / 1MB, 2) + ' MB'); } else { Write-Host '[DETENIDO] No hay proceso de servidor corriendo en segundo plano.' -ForegroundColor Yellow }; Write-Host ''; Write-Host 'Puertos activos en la red:'; netstat -ano | Select-String ':80 |:3000 '; if (Test-Path 'server.log') { Write-Host ''; Write-Host 'Últimas 8 líneas de server.log:' -ForegroundColor DarkGray; Get-Content 'server.log' -Tail 8 } }"

echo.
echo =====================================================================
pause
