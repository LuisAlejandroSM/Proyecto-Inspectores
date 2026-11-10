' Inicia el servidor de producción en segundo plano de forma 100% invisible (sin consola)
Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")
ScriptDir = FSO.GetParentFolderName(WScript.ScriptFullName)
AppDir = FSO.GetParentFolderName(ScriptDir)
WshShell.CurrentDirectory = AppDir

' 1. Liberar puertos 80, 8030 y 3000 de procesos previos (evita error EADDRINUSE)
WshShell.Run "powershell -WindowStyle Hidden -Command ""Get-NetTCPConnection -LocalPort 80,8030,3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }; Stop-Process -Name 'bun','node' -Force -ErrorAction SilentlyContinue""", 0, True

' 2. Iniciar el servidor (si bun falla o no existe en esta versión de Windows, arranca con npm)
WshShell.Run "cmd /c ""bun --version >nul 2>&1 && (bun run start > server.log 2>&1) || (npm run start > server.log 2>&1)""", 0, False
