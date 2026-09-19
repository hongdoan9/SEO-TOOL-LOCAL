' ============================================
' CREATE DESKTOP SHORTCUT - SEO Tool Local
' Chay file nay 1 lan de tao shortcut tren Desktop
' ============================================

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Lay duong dan Desktop cua user hien tai
desktopPath = WshShell.SpecialFolders("Desktop")

' Lay thu muc chua script nay (= thu muc du an)
projectDir = fso.GetParentFolderName(WScript.ScriptFullName)

' Duong dan toi run.vbs
targetPath = projectDir & "\run.vbs"

' Kiem tra run.vbs co ton tai khong
If Not fso.FileExists(targetPath) Then
    MsgBox "Khong tim thay file run.vbs tai:" & vbCrLf & targetPath, vbCritical, "Loi"
    WScript.Quit
End If

' Tao shortcut tren Desktop
shortcutPath = desktopPath & "\SEO Tool V2.lnk"
Set shortcut = WshShell.CreateShortcut(shortcutPath)

shortcut.TargetPath = "wscript.exe"
shortcut.Arguments = chr(34) & targetPath & chr(34)
shortcut.WorkingDirectory = projectDir
shortcut.Description = "Mo SEO Tool Local (an terminal)"
shortcut.WindowStyle = 7  ' Minimized - dam bao an hoan toan

' Dung icon globe (internet) cua Windows
shortcut.IconLocation = "%SystemRoot%\system32\shell32.dll,14"

shortcut.Save

' Thong bao thanh cong
MsgBox "Da tao shortcut ""SEO Tool"" tren Desktop thanh cong!" & vbCrLf & vbCrLf & _
       "Click vao icon tren Desktop de mo SEO Tool." & vbCrLf & _
       "Khong hien terminal, chi mo trinh duyet.", vbInformation, "Thanh cong!"

' Don dep
Set shortcut = Nothing
Set WshShell = Nothing
Set fso = Nothing
