#Requires -Version 5.1
# Lanzador silencioso para tarea programada (sin ventana).
$env:LTS_TUNNEL_MODE = "quick"
& (Join-Path $PSScriptRoot "tunnel-stack.ps1") -Action start
