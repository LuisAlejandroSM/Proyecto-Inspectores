' Inicia el servidor de producción en segundo plano de forma 100% invisible (sin consola)
Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")
ScriptDir = FSO.GetParentFolderName(WScript.ScriptFullName)
AppDir = FSO.GetParentFolderName(ScriptDir)
WshShell.CurrentDirectory = AppDir

' 1. Liberar puertos 80 y 3000 de procesos previos (evita error EADDRINUSE)
WshShell.Run "powershell -WindowStyle Hidden -Command ""Get-NetTCPConnection -LocalPort 80,3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }; Stop-Process -Name 'bun','node' -Force -ErrorAction SilentlyContinue""", 0, True

' 2. Iniciar bun run start en la raíz del proyecto guardando log de salida
WshShell.Run "cmd /c ""bun run start > server.log 2>&1""", 0, False
