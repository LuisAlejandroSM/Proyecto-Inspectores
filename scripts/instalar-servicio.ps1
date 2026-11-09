param(
    [string]$Accion = "activar"
)

$ErrorActionPreference = "Continue"
$Raiz = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$scriptUpdate = [string](Join-Path $Raiz "scripts\auto-actualizar.ps1")
$vbsPath = [string](Join-Path $Raiz "scripts\iniciar-segundo-plano.vbs")
$startupFolder = [Environment]::GetFolderPath('Startup')
$shortcutPath = [string](Join-Path $startupFolder "SistemaSST.lnk")

if ($Accion -eq "desactivar") {
    Unregister-ScheduledTask -TaskName 'SistemaCronogramasSST' -Confirm:$false -ErrorAction SilentlyContinue
    Unregister-ScheduledTask -TaskName 'SistemaCronogramasAutoUpdate' -Confirm:$false -ErrorAction SilentlyContinue
    Remove-Item $shortcutPath -Force -ErrorAction SilentlyContinue
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

# 3. Registrar en la carpeta de Inicio de Windows (Startup) con VBScript invisible
# Se ejecuta bajo la cuenta del usuario actual (sin permisos de SYSTEM que bloqueen .env.local)
# Y con estilo de ventana 0 = 100% INVISIBLE, sin ventana negra en pantalla.
$wsh = New-Object -ComObject WScript.Shell
$sc = $wsh.CreateShortcut($shortcutPath)
$sc.TargetPath = "wscript.exe"
$sc.Arguments = "`"$vbsPath`""
$sc.WorkingDirectory = [string]$Raiz
$sc.Save()

# 4. Registrar la tarea de inicio automático al iniciar sesión
$actionWeb = New-ScheduledTaskAction -Execute 'wscript.exe' -Argument "`"$vbsPath`"" -WorkingDirectory ([string]$Raiz)
$triggerWeb = New-ScheduledTaskTrigger -AtLogOn
$settingsWeb = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)

Register-ScheduledTask -TaskName 'SistemaCronogramasSST' -Action $actionWeb -Trigger $triggerWeb -Settings $settingsWeb -Description 'Servidor Web 24/7 Sistema SST/SIHO' -RunLevel Highest

# 5. Registrar el Vigilante de Auto-Actualización (revisa GitHub en segundo plano cada 5 minutos)
$actionUpdate = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"`"$scriptUpdate`"`"" -WorkingDirectory ([string]$Raiz)
$triggerUpdate = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 5)
$settingsUpdate = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew

Register-ScheduledTask -TaskName 'SistemaCronogramasAutoUpdate' -Action $actionUpdate -Trigger $triggerUpdate -Settings $settingsUpdate -Description 'Vigilante de Actualizaciones GitHub SST/SIHO' -RunLevel Highest

# 6. Abrir puertos 80 y 3000 en el Firewall de Windows para la red local
New-NetFirewallRule -DisplayName "Sistema SST (Puertos 80 y 3000)" -Direction Inbound -LocalPort 80,3000 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue | Out-Null

# 7. Iniciar el servidor invisible de una vez en este momento
Start-Process "wscript.exe" -ArgumentList "`"$vbsPath`"" -WorkingDirectory ([string]$Raiz)

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "====================================================================="
Write-Host "[EXITO] ¡Servidor configurado como Servicio Invisible 24/7!"
Write-Host "1. NO HAY TERMINAL ABIERTA: Corre en segundo plano de forma 100% invisible."
Write-Host "2. PUERTO 80 ESTANDAR: Solo escribe la IP o el dominio directamente."
Write-Host "   Ejemplo: http://[IP-DE-LA-VM] (sin :3000 ni ningun puerto)."
Write-Host "3. SI REINICIAS LA VM: Arranca completamente solo."
Write-Host "4. YA ESTA ACTIVO: Abre la pagina en tu laptop."
Write-Host "====================================================================="
