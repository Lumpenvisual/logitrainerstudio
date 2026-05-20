#Requires -Version 5.1
# Arranca Vite en :8080 sin ventanas cmd (para tareas programadas).
$ErrorActionPreference = "Stop"
$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
. (Join-Path $PSScriptRoot "tunnel-helpers.ps1")

if (Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue) { exit 0 }
Start-LtsViteHidden -ProjectRoot $ProjectRoot.Path | Out-Null
