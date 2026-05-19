#Requires -Version 5.1
$ErrorActionPreference = "Stop"

function Refresh-Path {
  $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
    [System.Environment]::GetEnvironmentVariable("Path", "User")
}

Refresh-Path
if (Get-Command cloudflared -ErrorAction SilentlyContinue) {
  Write-Host "cloudflared ya instalado:" -ForegroundColor Green
  cloudflared --version
  exit 0
}

Write-Host "Instalando cloudflared con winget..." -ForegroundColor Cyan
winget install --id Cloudflare.cloudflared -e --accept-source-agreements --accept-package-agreements
Refresh-Path

if (-not (Get-Command cloudflared -ErrorAction SilentlyContinue)) {
  Write-Error "No se encontró cloudflared en PATH. Reinicia la terminal e inténtalo de nuevo."
}
cloudflared --version
Write-Host "Listo. Siguiente paso: .\scripts\setup-tunnel.ps1" -ForegroundColor Green
