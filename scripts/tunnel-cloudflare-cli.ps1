#Requires -Version 5.1
<#
  Flujo manual Cloudflare (mismos comandos que la documentación oficial).
  Ejecutar en PowerShell NORMAL (no hace falta Admin salvo instalar).

  Uso:
    cd C:\proyectos\logitrainerstudio
    .\scripts\tunnel-cloudflare-cli.ps1
#>
$ErrorActionPreference = "Stop"
$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$TunnelName = "logitrainer-studio"
$Hostname = "studio.logitrainerstudio.com"
$CloudflaredDir = Join-Path $ProjectRoot ".cloudflared"

function Refresh-Path {
  $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
    [System.Environment]::GetEnvironmentVariable("Path", "User")
}
Refresh-Path

if (-not (Get-Command cloudflared -ErrorAction SilentlyContinue)) {
  Write-Host "Instalando cloudflared..." -ForegroundColor Cyan
  winget install --id Cloudflare.cloudflared -e --accept-source-agreements --accept-package-agreements
  Refresh-Path
}

Write-Host "`ncloudflared:" -ForegroundColor Green
cloudflared --version

$cert = Join-Path $env:USERPROFILE ".cloudflared\cert.pem"
if (-not (Test-Path $cert)) {
  Write-Host "`n[1/4] Login Cloudflare (se abre el navegador)..." -ForegroundColor Cyan
  Write-Host "      Elige la zona: logitrainerstudio.com`n"
  cloudflared tunnel login
} else {
  Write-Host "`n[1/4] Login: cert.pem ya existe, omitido." -ForegroundColor Yellow
}

Set-Location $ProjectRoot
New-Item -ItemType Directory -Force -Path $CloudflaredDir | Out-Null

Write-Host "`n[2/4] Crear túnel '$TunnelName'..." -ForegroundColor Cyan
$listJson = cloudflared tunnel list --output json 2>$null | ConvertFrom-Json
$exists = $listJson | Where-Object { $_.name -eq $TunnelName }
if (-not $exists) {
  cloudflared tunnel create $TunnelName
} else {
  Write-Host "Túnel ya existe (id: $($exists.id))." -ForegroundColor Yellow
}

Write-Host "`n[3/4] DNS + config.yml (localhost:8080)..." -ForegroundColor Cyan
cloudflared tunnel route dns $TunnelName $Hostname 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Crea CNAME manual: $Hostname -> <tunnel-id>.cfargotunnel.com" -ForegroundColor Yellow
}

$listJson = cloudflared tunnel list --output json | ConvertFrom-Json
$entry = $listJson | Where-Object { $_.name -eq $TunnelName } | Select-Object -First 1
$tunnelId = $entry.id
$credUser = Join-Path $env:USERPROFILE ".cloudflared\$tunnelId.json"
$credProj = Join-Path $CloudflaredDir "$tunnelId.json"
if (Test-Path $credUser) { Copy-Item -Force $credUser $credProj }

$configPath = Join-Path $CloudflaredDir "config.yml"
@"
tunnel: $TunnelName
credentials-file: .cloudflared\$tunnelId.json

ingress:
  - hostname: $Hostname
    service: http://localhost:8080
  - service: http_status:404
"@ | Set-Content -Encoding UTF8 $configPath

Write-Host "Config: $configPath" -ForegroundColor Green

Write-Host @"

[4/4] Iniciar app + túnel
  Terminal A:  npm start
  Terminal B:  cloudflared tunnel run $TunnelName
           o: npm run tunnel:start

URL: https://$Hostname/studio
Contraseña: LTS-Mayo2026-7kQ!

"@ -ForegroundColor Cyan

$start = Read-Host "¿Iniciar túnel ahora? (s/N)"
if ($start -match '^[sS]') {
  if (-not (Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue)) {
    Write-Host "AVISO: nada escucha en :8080. Ejecuta 'npm start' en otra terminal." -ForegroundColor Yellow
  }
  cloudflared tunnel --config $configPath run $TunnelName
}
