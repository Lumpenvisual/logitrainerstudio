#Requires -Version 5.1
<#
.SYNOPSIS
  Túnel Cloudflare persistente (servicio Windows) + app Vite al arranque.

  Ejecutar PowerShell como Administrador:
    cd C:\proyectos\logitrainerstudio
    .\scripts\install-persistent-tunnel.ps1

  Requiere login previo en Cloudflare (abre navegador si falta cert.pem).
#>
param(
  [switch]$SkipLogin,
  [switch]$SkipViteTask
)

$ErrorActionPreference = "Stop"
$ProjectRoot = "C:\proyectos\logitrainerstudio"
$CloudflaredDir = Join-Path $ProjectRoot ".cloudflared"
$TunnelName = "logitrainer-studio"
$Hostname = "studio.logitrainerstudio.com"
$CertPath = Join-Path $env:USERPROFILE ".cloudflared\cert.pem"

function Refresh-Path {
  $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
    [System.Environment]::GetEnvironmentVariable("Path", "User")
}
Refresh-Path

function Require-Admin {
  $id = [Security.Principal.WindowsIdentity]::GetCurrent()
  $p = New-Object Security.Principal.WindowsPrincipal($id)
  if (-not $p.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Error "Ejecuta PowerShell como Administrador."
  }
}

if (-not (Get-Command cloudflared -ErrorAction SilentlyContinue)) {
  & (Join-Path $ProjectRoot "scripts\install-cloudflared.ps1")
  Refresh-Path
}

New-Item -ItemType Directory -Force -Path $CloudflaredDir | Out-Null
Set-Location $ProjectRoot

$envLocal = Join-Path $ProjectRoot ".env.local"
if (Test-Path $envLocal) {
  Get-Content $envLocal | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
      Set-Item -Path "Env:$($matches[1].Trim())" -Value $matches[2].Trim().Trim('"').Trim("'")
    }
  }
}

# --- Token (sin login interactivo) ---
if ($env:CLOUDFLARE_TUNNEL_TOKEN) {
  Write-Host "Usando CLOUDFLARE_TUNNEL_TOKEN — tarea persistente stack" -ForegroundColor Cyan
  Require-Admin
  & (Join-Path $ProjectRoot "scripts\install-persistent-stack.ps1")
  exit 0
}

# --- Login ---
New-Item -ItemType Directory -Force -Path (Split-Path $CertPath) | Out-Null
if (-not $SkipLogin -and -not (Test-Path $CertPath)) {
  Write-Host "`nAbre el navegador y autoriza logitrainerstudio.com..." -ForegroundColor Cyan
  cloudflared tunnel login
}
if (-not (Test-Path $CertPath)) {
  Write-Error @"
Sin cert.pem. Opciones:
  1) scripts\open-cloudflare-login.bat
  2) Añade CLOUDFLARE_TUNNEL_TOKEN en .env.local (Zero Trust > Tunnels > Install connector)
  3) npm run tunnel:verify  (usa quick tunnel sin login)
"@
}

# --- Crear túnel ---
$listJson = @(cloudflared tunnel list --output json 2>$null | ConvertFrom-Json)
$entry = $listJson | Where-Object { $_.name -eq $TunnelName } | Select-Object -First 1
if (-not $entry) {
  Write-Host "Creando túnel $TunnelName..." -ForegroundColor Cyan
  cloudflared tunnel create $TunnelName
  $listJson = @(cloudflared tunnel list --output json | ConvertFrom-Json)
  $entry = $listJson | Where-Object { $_.name -eq $TunnelName } | Select-Object -First 1
}
$tunnelId = $entry.id
Write-Host "Túnel ID: $tunnelId" -ForegroundColor Green

# --- DNS ---
cloudflared tunnel route dns $TunnelName $Hostname 2>$null
cloudflared tunnel route dns $TunnelName "tunel.logitrainerstudio.com" 2>$null

# --- Credenciales (rutas absolutas para el servicio SYSTEM) ---
$credSrc = Join-Path $env:USERPROFILE ".cloudflared\$tunnelId.json"
$credDst = Join-Path $CloudflaredDir "$tunnelId.json"
if (Test-Path $credSrc) { Copy-Item -Force $credSrc $credDst }

$configPath = Join-Path $CloudflaredDir "config.yml"
@"
tunnel: $tunnelId
credentials-file: $credDst

ingress:
  - hostname: $Hostname
    service: http://localhost:8080
  - hostname: tunel.logitrainerstudio.com
    service: http://localhost:8080
  - service: http_status:404
"@ | Set-Content -Encoding UTF8 $configPath

Write-Host "Config: $configPath" -ForegroundColor Green

# --- Servicio cloudflared (persistente) ---
Require-Admin
$svc = Get-Service -Name "cloudflared" -ErrorAction SilentlyContinue
if ($svc) {
  Stop-Service cloudflared -Force -ErrorAction SilentlyContinue
  cloudflared service uninstall 2>$null
  Start-Sleep -Seconds 2
}

$userConfig = Join-Path $env:USERPROFILE ".cloudflared\config.yml"
Copy-Item -Force $configPath $userConfig
cloudflared --config $configPath service install
Start-Service cloudflared
Set-Service cloudflared -StartupType Automatic
Write-Host "Servicio cloudflared: Running + Automatic" -ForegroundColor Green

# --- Tarea programada: Vite al iniciar sesión (sin ventana cmd) ---
if (-not $SkipViteTask) {
  . (Join-Path $ProjectRoot "scripts\tunnel-helpers.ps1")
  $taskName = "LogiTrainerStudio-Vite"
  $viteScript = Join-Path $ProjectRoot "scripts\start-vite-only.ps1"
  $action = New-LtsHiddenTaskAction -ProjectRoot $ProjectRoot -ScriptPath $viteScript
  $trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
  $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
  Register-LtsHiddenScheduledTask -TaskName $taskName -Action $action -Trigger @($trigger) -RunLevel Limited -Settings $settings
  Start-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
  Write-Host "Tarea $taskName registrada (Vite oculto al iniciar sesión)." -ForegroundColor Green
}

# --- Arrancar Vite ahora si no está en 8080 ---
if (-not (Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue)) {
  & (Join-Path $ProjectRoot "scripts\start-vite-only.ps1")
  Write-Host "Iniciando Vite (sin ventana)..." -ForegroundColor Cyan
  Start-Sleep -Seconds 8
}

Write-Host @"

=== Túnel persistente listo ===
  URL:    https://$Hostname/studio
  Login:  LTS-Mayo2026-7kQ!

  sc query cloudflared
  sc stop cloudflared / sc start cloudflared
  Get-ScheduledTask -TaskName LogiTrainerStudio-Vite

"@ -ForegroundColor Cyan
