#Requires -Version 5.1
# Inicia Vite (:8080) en segundo plano y el túnel en primer plano.
$ErrorActionPreference = "Stop"
$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $ProjectRoot

. (Join-Path $PSScriptRoot "tunnel-helpers.ps1")
$vite = Start-LtsViteHidden -ProjectRoot $ProjectRoot.Path
Write-Host "Vite en segundo plano (PID $($vite.Id), sin ventana cmd)." -ForegroundColor Cyan
Start-Sleep -Seconds 4

try {
  & (Join-Path $PSScriptRoot "start-tunnel.ps1")
} finally {
  Stop-Process -Id $vite.Id -Force -ErrorAction SilentlyContinue
}
