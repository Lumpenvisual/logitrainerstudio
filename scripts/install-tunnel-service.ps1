#Requires -RunAsAdministrator
#Requires -Version 5.1
<#
  Instala cloudflared como servicio de Windows (túnel 24/7).
  Requiere .cloudflared\config.yml ya generado (setup-tunnel.ps1).
#>
$ErrorActionPreference = "Stop"
$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$config = Join-Path $ProjectRoot ".cloudflared\config.yml"

function Refresh-Path {
  $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
    [System.Environment]::GetEnvironmentVariable("Path", "User")
}
Refresh-Path

if (-not (Test-Path $config)) {
  Write-Error "Falta $config — ejecuta setup-tunnel.ps1 primero."
}

$userConfig = Join-Path $env:USERPROFILE ".cloudflared\config.yml"
Copy-Item -Force $config $userConfig
Write-Host "Config copiado a $userConfig" -ForegroundColor Cyan

Set-Location $ProjectRoot
Write-Host "Instalando servicio cloudflared..." -ForegroundColor Cyan
cloudflared --config $userConfig service install

Write-Host @"

Servicio instalado. Asegúrate de que la app escuche en :8080 (npm start).

Comandos útiles:
  sc query cloudflared
  sc stop cloudflared
  sc start cloudflared

"@ -ForegroundColor Green
