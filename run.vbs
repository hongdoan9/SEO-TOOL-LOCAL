Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)

Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = scriptDir
WshShell.Run chr(34) & scriptDir & "\start.bat" & chr(34), 0, False

Set WshShell = Nothing
Set fso = Nothing
