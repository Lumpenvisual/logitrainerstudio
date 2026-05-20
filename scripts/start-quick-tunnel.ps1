#Requires -Version 5.1
# Túnel rápido trycloudflare.com (sin login Cloudflare) — pruebas locales.
$ErrorActionPreference = "Stop"
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
. (Join-Path $PSScriptRoot "tunnel-helpers.ps1")
$LogFile = Join-Path $ProjectRoot ".cloudflared\quick-tunnel-url.txt"

function Refresh-Path {
  $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
    [System.Environment]::GetEnvironmentVariable("Path", "User")
}
Refresh-Path

if (-not (Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue)) {
  Write-Error "Puerto 8080 libre. Ejecuta primero: npm start"
}

New-Item -ItemType Directory -Force -Path (Join-Path $ProjectRoot ".cloudflared") | Out-Null
Write-Host "Iniciando quick tunnel -> http://localhost:8080" -ForegroundColor Cyan
Write-Host "La URL aparecerá en unos segundos...`n" -ForegroundColor Yellow

$logPath = Join-Path $ProjectRoot ".cloudflared\quick-tunnel.log"
$proc = Start-LtsCloudflaredQuickHidden -LogFile $logPath -WorkingDirectory $ProjectRoot

Start-Sleep -Seconds 12
$log = Get-Content (Join-Path $ProjectRoot ".cloudflared\quick-tunnel.log") -Raw -ErrorAction SilentlyContinue
if ($log -match "(https://[a-z0-9-]+\.trycloudflare\.com)") {
  $url = $Matches[1]
  $url | Set-Content $LogFile
  Write-Host "URL: $url" -ForegroundColor Green
  Write-Host "Studio: $url/studio" -ForegroundColor Green
  Write-Host "E2E:    npm run test:e2e:tunnel" -ForegroundColor Cyan
} else {
  Write-Host "Revisa .cloudflared\quick-tunnel.log" -ForegroundColor Yellow
}

Write-Host "cloudflared PID $($proc.Id) (segundo plano, sin ventana)." -ForegroundColor Cyan
