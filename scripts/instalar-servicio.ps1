param(
    [string]$Accion = "activar"
)

$ErrorActionPreference = "Continue"
$Raiz = Resolve-Path (Join-Path $PSScriptRoot "..")
$scriptUpdate = Join-Path $Raiz "scripts\auto-actualizar.ps1"

# Buscar bun.exe en el sistema
$bunPath = (Get-Command "bun" -ErrorAction SilentlyContinue).Source
if (-not $bunPath) {
    if (Test-Path "C:\Windows\System32\bun.exe") {
        $bunPath = "C:\Windows\System32\bun.exe"
    } else {
        $bunPath = "bun.exe"
    }
}

if ($Accion -eq "desactivar") {
    Unregister-ScheduledTask -TaskName 'SistemaCronogramasSST' -Confirm:$false -ErrorAction SilentlyContinue
    Unregister-ScheduledTask -TaskName 'SistemaCronogramasAutoUpdate' -Confirm:$false -ErrorAction SilentlyContinue
    Get-Process -Name "bun" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -match "start" } | Stop-Process -Force -ErrorAction SilentlyContinue
    taskkill /F /IM bun.exe 2>$null
    Write-Host "[OK] Servicios automáticos desactivados y detenidos."
    exit 0
}

Write-Host "Configurando el Sistema como SERVICIO INVISIBLE (sin terminales abiertas)..."

# 1. Detener procesos existentes de bun para evitar bloqueos
Get-Process -Name "bun" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -match "start" } | Stop-Process -Force -ErrorAction SilentlyContinue
taskkill /F /IM bun.exe 2>$null

# 2. Eliminar tareas anteriores si existen
Unregister-ScheduledTask -TaskName 'SistemaCronogramasSST' -Confirm:$false -ErrorAction SilentlyContinue
Unregister-ScheduledTask -TaskName 'SistemaCronogramasAutoUpdate' -Confirm:$false -ErrorAction SilentlyContinue

# 3. Registrar el Servidor Web bajo SYSTEM (Sesión 0 = 100% Invisible, sin ventana negra)
# Se ejecuta en el puerto 80 (HTTP estándar), así que no requiere escribir ningún puerto en el navegador.
$actionWeb = New-ScheduledTaskAction -Execute $bunPath -Argument 'run start' -WorkingDirectory $Raiz
$triggerWeb = New-ScheduledTaskTrigger -AtStartup
$settingsWeb = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -RestartCount 5 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit 0

Register-ScheduledTask -TaskName 'SistemaCronogramasSST' -Action $actionWeb -Trigger $triggerWeb -Settings $settingsWeb -Description 'Servidor Web 24/7 Sistema SST/SIHO (Puerto 80)' -User 'NT AUTHORITY\SYSTEM' -RunLevel Highest

# 4. Registrar el Vigilante de Auto-Actualización (revisa GitHub en segundo plano cada 5 minutos)
$actionUpdate = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"`"$scriptUpdate`"`"" -WorkingDirectory $Raiz
$triggerUpdate = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 5)
$settingsUpdate = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew

Register-ScheduledTask -TaskName 'SistemaCronogramasAutoUpdate' -Action $actionUpdate -Trigger $triggerUpdate -Settings $settingsUpdate -Description 'Vigilante de Actualizaciones GitHub SST/SIHO' -User 'NT AUTHORITY\SYSTEM' -RunLevel Highest

# 5. Iniciar la tarea como servicio inmediatamente
Start-ScheduledTask -TaskName 'SistemaCronogramasSST' -ErrorAction SilentlyContinue

# 6. Abrir puertos 80 y 3000 en el Firewall de Windows para la red local
New-NetFirewallRule -DisplayName "Sistema SST (Puertos 80 y 3000)" -Direction Inbound -LocalPort 80,3000 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue | Out-Null

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "====================================================================="
Write-Host "[EXITO] ¡Servidor configurado como Servicio 24/7 de Windows!"
Write-Host "1. NO HAY TERMINAL ABIERTA: Corre en segundo plano como servicio del sistema."
Write-Host "2. PUERTO 80 ESTANDAR: Solo pon la IP o el dominio directamente en el navegador."
Write-Host "   Ejemplo: http://[IP-DE-LA-VM] (sin necesidad de escribir :3000 ni ningun puerto)."
Write-Host "3. SI SE REINICIA LA VM: Arranca completamente solo al encender el equipo."
Write-Host "4. YA ESTA ACTIVO: Puedes cerrar todas las ventanas de consola."
Write-Host "====================================================================="
