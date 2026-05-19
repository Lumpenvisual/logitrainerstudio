#Requires -Version 5.1
<#
.SYNOPSIS
  Configura Cloudflare Tunnel para LogiTrainer Studio (una sola vez).

.PREREQUISITES
  1. Dominio logitrainerstudio.com en Cloudflare (DNS activo).
  2. cloudflared instalado (scripts\install-cloudflared.bat).
  3. Ejecutar este script en PowerShell como usuario normal.

.MANUAL (si el script no puede crear DNS automáticamente)
  En Zero Trust > Networks > Tunnels > tu túnel > Public Hostname:
    Hostname: studio.logitrainerstudio.com
    Service: http://localhost:8080
#>
$ErrorActionPreference = "Stop"
$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$CloudflaredDir = Join-Path $ProjectRoot ".cloudflared"
$TunnelName = if ($env:CLOUDFLARE_TUNNEL_NAME) { $env:CLOUDFLARE_TUNNEL_NAME } else { "logitrainer-studio" }
$Hostname = if ($env:CLOUDFLARE_TUNNEL_HOST) { $env:CLOUDFLARE_TUNNEL_HOST } else { "studio.logitrainerstudio.com" }

function Refresh-Path {
  $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
    [System.Environment]::GetEnvironmentVariable("Path", "User")
}
Refresh-Path

if (-not (Get-Command cloudflared -ErrorAction SilentlyContinue)) {
  Write-Error "cloudflared no está en PATH. Ejecuta scripts\install-cloudflared.bat primero."
}

New-Item -ItemType Directory -Force -Path $CloudflaredDir | Out-Null
Set-Location $ProjectRoot

Write-Host "`n=== Paso 1: Iniciar sesión en Cloudflare ===" -ForegroundColor Cyan
Write-Host "Se abrirá el navegador. Elige la cuenta que gestiona logitrainerstudio.com`n"
cloudflared tunnel login

Write-Host "`n=== Paso 2: Crear túnel '$TunnelName' ===" -ForegroundColor Cyan
$existing = cloudflared tunnel list 2>$null | Select-String $TunnelName
if (-not $existing) {
  cloudflared tunnel create $TunnelName
} else {
  Write-Host "El túnel '$TunnelName' ya existe." -ForegroundColor Yellow
}

Write-Host "`n=== Paso 3: DNS público ($Hostname) ===" -ForegroundColor Cyan
cloudflared tunnel route dns $TunnelName $Hostname 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host "No se pudo crear el CNAME automáticamente." -ForegroundColor Yellow
  Write-Host "Crea manualmente en Cloudflare DNS un CNAME:" -ForegroundColor Yellow
  Write-Host "  studio -> <tunnel-id>.cfargotunnel.com (proxy naranja ON)" -ForegroundColor Yellow
}

Write-Host "`n=== Paso 4: Generar config.yml ===" -ForegroundColor Cyan
$tunnelInfo = cloudflared tunnel list --output json 2>$null | ConvertFrom-Json
$entry = $tunnelInfo | Where-Object { $_.name -eq $TunnelName } | Select-Object -First 1
if (-not $entry) {
  Write-Error "No se encontró el túnel '$TunnelName'. Revisa: cloudflared tunnel list"
}

$tunnelId = $entry.id
$credSrc = Join-Path $env:USERPROFILE ".cloudflared\$tunnelId.json"
$credDst = Join-Path $CloudflaredDir "$tunnelId.json"
if (Test-Path $credSrc) {
  Copy-Item -Force $credSrc $credDst
} elseif (-not (Test-Path $credDst)) {
  Write-Warning "No se encontró $credSrc — copia manualmente el JSON de credenciales a $credDst"
}

$configPath = Join-Path $CloudflaredDir "config.yml"
$altHost = "tunel.logitrainerstudio.com"
$credRel = ".cloudflared\$tunnelId.json"
@"
tunnel: $TunnelName
credentials-file: $credRel

ingress:
  - hostname: $Hostname
    service: http://localhost:8080
  - hostname: $altHost
    service: http://localhost:8080
  - service: http_status:404
"@ | Set-Content -Encoding UTF8 $configPath

Write-Host "`n=== Configuración lista ===" -ForegroundColor Green
Write-Host "  config:     $configPath"
Write-Host "  tunnel id:  $tunnelId"
Write-Host "  URL:        https://$Hostname/studio"
Write-Host "`nInicia la app y el túnel:" -ForegroundColor Cyan
Write-Host "  npm run tunnel:platform"
Write-Host "  (o en dos terminales: npm start  y  npm run tunnel:start)"
