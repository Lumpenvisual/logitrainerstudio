#Requires -Version 5.1
<#
  Arranca Vite (:8080) + túnel Cloudflare y devuelve la URL pública.
  Prioridad: config.yml > CLOUDFLARE_TUNNEL_TOKEN > quick tunnel (trycloudflare.com)

  Uso:
    .\scripts\tunnel-stack.ps1 -Action start
    .\scripts\tunnel-stack.ps1 -Action stop
    .\scripts\tunnel-stack.ps1 -Action status
    .\scripts\tunnel-stack.ps1 -Action url
#>
param(
  [ValidateSet("start", "stop", "status", "url")]
  [string]$Action = "start"
)

$ErrorActionPreference = "Stop"
$ProjectRoot = "C:\proyectos\logitrainerstudio"
. (Join-Path $PSScriptRoot "tunnel-helpers.ps1")
$CloudflaredDir = Join-Path $ProjectRoot ".cloudflared"
$PidFile = Join-Path $CloudflaredDir "stack.pids.json"
$UrlFile = Join-Path $CloudflaredDir "quick-tunnel-url.txt"
$LogFile = Join-Path $CloudflaredDir "quick-tunnel.log"
$ConfigFile = Join-Path $CloudflaredDir "config.yml"
$EnvLocal = Join-Path $ProjectRoot ".env.local"

function Refresh-Path {
  $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
    [System.Environment]::GetEnvironmentVariable("Path", "User")
}
Refresh-Path

function Load-EnvLocal {
  if (-not (Test-Path $EnvLocal)) { return }
  Get-Content $EnvLocal | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
      $k = $matches[1].Trim()
      $v = $matches[2].Trim().Trim('"').Trim("'")
      Set-Item -Path "Env:$k" -Value $v
    }
  }
}

function Stop-Stack {
  if (Test-Path $PidFile) {
    $pids = Get-Content $PidFile | ConvertFrom-Json
    foreach ($name in @("vite", "cloudflared")) {
      $id = $pids.$name
      if ($id) { Stop-Process -Id $id -Force -ErrorAction SilentlyContinue }
    }
    Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
  }
  Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
  Write-Host "Stack detenido." -ForegroundColor Yellow
}

function Wait-Port([int]$Port, [int]$Seconds = 60) {
  foreach ($i in 1..$Seconds) {
    if (Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue) { return $true }
    Start-Sleep -Seconds 1
  }
  return $false
}

function Start-Vite {
  if (Wait-Port 8080 3) {
    Write-Host "Vite ya en :8080" -ForegroundColor Yellow
    return $null
  }
  $p = Start-LtsViteHidden -ProjectRoot $ProjectRoot
  if (-not (Wait-Port 8080 90)) { throw "Vite no arrancó en :8080" }
  Write-Host "Vite PID $($p.Id)" -ForegroundColor Green
  return $p.Id
}

function Get-QuickTunnelUrl {
  if (-not (Test-Path $LogFile)) { return $null }
  $log = Get-Content $LogFile -Raw -ErrorAction SilentlyContinue
  if ($log -match "(https://[a-z0-9-]+\.trycloudflare\.com)") { return $Matches[1] }
  return $null
}

function Start-TunnelNamed {
  if (-not (Test-Path $ConfigFile)) { return $null }
  $p = Start-LtsProcessNoWindow -FilePath "cloudflared" -ArgumentList @("tunnel", "--config", $ConfigFile, "run") `
    -WorkingDirectory $ProjectRoot
  Start-Sleep -Seconds 5
  return @{ pid = $p.Id; url = "https://studio.logitrainerstudio.com" }
}

function Start-TunnelToken([string]$Token) {
  $p = Start-LtsProcessNoWindow -FilePath "cloudflared" -ArgumentList @("tunnel", "run", "--token", $Token) `
    -WorkingDirectory $ProjectRoot
  Start-Sleep -Seconds 8
  $host = if ($env:CLOUDFLARE_TUNNEL_HOST) { $env:CLOUDFLARE_TUNNEL_HOST } else { "studio.logitrainerstudio.com" }
  return @{ pid = $p.Id; url = "https://$host" }
}

function Start-TunnelQuick {
  Remove-Item $LogFile -Force -ErrorAction SilentlyContinue
  $p = Start-LtsCloudflaredQuickHidden -LogFile $LogFile -WorkingDirectory $ProjectRoot
  foreach ($i in 1..45) {
    Start-Sleep -Seconds 1
    $url = Get-QuickTunnelUrl
    if ($url) {
      $url | Set-Content $UrlFile -Encoding UTF8
      Start-Sleep -Seconds 5
      try {
        $r = Invoke-WebRequest -Uri "$url/studio/login" -UseBasicParsing -TimeoutSec 20
        if ($r.StatusCode -eq 200) { return @{ pid = $p.Id; url = $url } }
      } catch { /* esperar a Vite */ }
    }
  }
  throw "No se obtuvo URL trycloudflare operativa. Ver $LogFile"
}

function Start-Stack {
  Load-EnvLocal
  New-Item -ItemType Directory -Force -Path $CloudflaredDir | Out-Null
  if (-not (Get-Command cloudflared -ErrorAction SilentlyContinue)) {
    & (Join-Path $ProjectRoot "scripts\install-cloudflared.ps1")
    Refresh-Path
  }

  $vitePid = Start-Vite
  $tunnelPid = $null
  $url = $null

  $forceQuick = $env:LTS_TUNNEL_MODE -eq "quick"

  if (-not $forceQuick -and (Test-Path $ConfigFile) -and (Test-Path (Join-Path $env:USERPROFILE ".cloudflared\cert.pem"))) {
    Write-Host "Modo: túnel nombrado (config.yml)" -ForegroundColor Cyan
    $r = Start-TunnelNamed
    $tunnelPid = $r.pid
    $url = $r.url
  }
  elseif (-not $forceQuick -and $env:CLOUDFLARE_TUNNEL_TOKEN) {
    Write-Host "Modo: túnel con token" -ForegroundColor Cyan
    $r = Start-TunnelToken $env:CLOUDFLARE_TUNNEL_TOKEN
    $tunnelPid = $r.pid
    $url = $r.url
  }
  else {
    Write-Host "Modo: quick tunnel (trycloudflare.com)" -ForegroundColor Cyan
    $r = Start-TunnelQuick
    $tunnelPid = $r.pid
    $url = $r.url
  }

  @{ vite = $vitePid; cloudflared = $tunnelPid; url = $url; startedAt = (Get-Date).ToString("o") } |
    ConvertTo-Json | Set-Content $PidFile -Encoding UTF8

  Write-Host "URL: $url" -ForegroundColor Green
  Write-Host "Studio: $url/studio" -ForegroundColor Green
  return $url
}

function Get-Status {
  $vite = [bool](Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue)
  $cf = [bool](Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue)
  $url = if (Test-Path $UrlFile) { Get-Content $UrlFile -Raw } else { Get-QuickTunnelUrl }
  [PSCustomObject]@{ vite8080 = $vite; cloudflared = $cf; url = $url.Trim() }
}

Load-EnvLocal
Set-Location $ProjectRoot

switch ($Action) {
  "stop" { Stop-Stack }
  "status" { Get-Status | Format-List }
  "url" {
    if (Test-Path $UrlFile) { Get-Content $UrlFile -Raw }
    else { Get-QuickTunnelUrl }
  }
  default {
    Stop-Stack | Out-Null
    (Start-Stack)
  }
}
