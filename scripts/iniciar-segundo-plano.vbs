' Inicia el servidor de producción en segundo plano de forma 100% invisible (sin consola)
Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")
ScriptDir = FSO.GetParentFolderName(WScript.ScriptFullName)
AppDir = FSO.GetParentFolderName(ScriptDir)
WshShell.CurrentDirectory = AppDir
WshShell.Run "cmd /c bun run start", 0, False
