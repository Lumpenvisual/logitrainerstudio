#Requires -Version 5.1
$ErrorActionPreference = "Stop"
$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$config = Join-Path $ProjectRoot ".cloudflared\config.yml"

function Refresh-Path {
  $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
    [System.Environment]::GetEnvironmentVariable("Path", "User")
}
Refresh-Path

if (-not (Get-Command cloudflared -ErrorAction SilentlyContinue)) {
  Write-Error "cloudflared no instalado. Ejecuta scripts\install-cloudflared.bat"
}
if (-not (Test-Path $config)) {
  Write-Error "Falta .cloudflared\config.yml — ejecuta scripts\setup-tunnel.ps1"
}

Set-Location $ProjectRoot
Write-Host "Iniciando túnel (localhost:8080)..." -ForegroundColor Cyan
Write-Host "URL: https://studio.logitrainerstudio.com/studio" -ForegroundColor Green
cloudflared tunnel --config $config run
