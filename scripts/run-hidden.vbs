' Ejecuta un script .ps1 sin mostrar ninguna ventana.
Option Explicit
If WScript.Arguments.Count < 1 Then WScript.Quit 1

Dim sh, ps, scriptPath
scriptPath = WScript.Arguments(0)
Set sh = CreateObject("WScript.Shell")
ps = "powershell.exe -WindowStyle Hidden -NonInteractive -NoProfile -ExecutionPolicy Bypass -File """ & scriptPath & """"
sh.Run ps, 0, False
