param(
    [string]$Accion = "activar"
)

$ErrorActionPreference = "Continue"
$Raiz = Resolve-Path (Join-Path $PSScriptRoot "..")
$batServidor = Join-Path $Raiz "scripts\iniciar-produccion.bat"
$scriptUpdate = Join-Path $Raiz "scripts\auto-actualizar.ps1"

if ($Accion -eq "desactivar") {
    Unregister-ScheduledTask -TaskName 'SistemaCronogramasSST' -Confirm:$false -ErrorAction SilentlyContinue
    Unregister-ScheduledTask -TaskName 'SistemaCronogramasAutoUpdate' -Confirm:$false -ErrorAction SilentlyContinue
    Get-Process -Name "bun" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -match "start" } | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "[OK] Servicios automáticos desactivados y detenidos."
    exit 0
}

Write-Host "Configurando el Sistema para ejecución 24/7 en Windows..."

# 1. Eliminar tareas anteriores si existen
Unregister-ScheduledTask -TaskName 'SistemaCronogramasSST' -Confirm:$false -ErrorAction SilentlyContinue
Unregister-ScheduledTask -TaskName 'SistemaCronogramasAutoUpdate' -Confirm:$false -ErrorAction SilentlyContinue

# 2. Registrar el Servidor Web (Inicia con Windows al encender el equipo y al iniciar sesión)
$actionWeb = New-ScheduledTaskAction -Execute 'cmd.exe' -Argument "/c `"`"$batServidor`"`"" -WorkingDirectory $Raiz
$triggerWeb1 = New-ScheduledTaskTrigger -AtStartup
$triggerWeb2 = New-ScheduledTaskTrigger -AtLogOn
$settingsWeb = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)

Register-ScheduledTask -TaskName 'SistemaCronogramasSST' -Action $actionWeb -Trigger @($triggerWeb1, $triggerWeb2) -Settings $settingsWeb -Description 'Servidor Web 24/7 Sistema SST/SIHO' -RunLevel Highest

# 3. Registrar el Vigilante de Auto-Actualización (Revisa GitHub cada 5 minutos)
$actionUpdate = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"`"$scriptUpdate`"`"" -WorkingDirectory $Raiz
$triggerUpdate1 = New-ScheduledTaskTrigger -AtStartup
$triggerUpdate2 = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 5) -RepetitionDuration ([TimeSpan]::MaxValue)
$settingsUpdate = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew

Register-ScheduledTask -TaskName 'SistemaCronogramasAutoUpdate' -Action $actionUpdate -Trigger @($triggerUpdate1, $triggerUpdate2) -Settings $settingsUpdate -Description 'Vigilante de Actualizaciones GitHub SST/SIHO' -RunLevel Highest

# 4. Iniciar el servidor web de una vez en segundo plano
Start-ScheduledTask -TaskName 'SistemaCronogramasSST' -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "====================================================================="
Write-Host "[EXITO] ¡Sistema configurado para operar 24/7!"
Write-Host "1. El servidor web iniciará automáticamente cada vez que Windows encienda o se reinicie."
Write-Host "2. El auto-actualizador revisará GitHub cada 5 minutos y se actualizará solo."
Write-Host "3. El servidor ya fue iniciado en segundo plano. Puedes abrir http://localhost:3000"
Write-Host "====================================================================="
