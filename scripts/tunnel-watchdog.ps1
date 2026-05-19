#Requires -Version 5.1
# Mantiene Vite + Quick Tunnel activos; reinicia si caen.
$ErrorActionPreference = "SilentlyContinue"
$ProjectRoot = "C:\proyectos\logitrainerstudio"
$StackScript = Join-Path $ProjectRoot "scripts\tunnel-stack.ps1"
$UrlFile = Join-Path $ProjectRoot ".cloudflared\quick-tunnel-url.txt"
$LockFile = Join-Path $ProjectRoot ".cloudflared\watchdog.lock"

function Test-Health {
  $vite = [bool](Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue)
  $cf = [bool](Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue)
  if (-not $vite -or -not $cf) { return $false }
  $url = if (Test-Path $UrlFile) { (Get-Content $UrlFile -Raw).Trim() } else { $null }
  if (-not $url) { return $false }
  try {
    $r = Invoke-WebRequest -Uri "$url/studio/login" -UseBasicParsing -TimeoutSec 15
    return $r.StatusCode -eq 200
  } catch { return $false }
}

if (Test-Path $LockFile) {
  $age = (Get-Date) - (Get-Item $LockFile).LastWriteTime
  if ($age.TotalMinutes -lt 2) { exit 0 }
}
New-Item -ItemType Directory -Force -Path (Split-Path $LockFile) | Out-Null
Set-Content $LockFile (Get-Date).ToString("o")

$env:LTS_TUNNEL_MODE = "quick"
if (-not (Test-Health)) {
  & $StackScript -Action stop | Out-Null
  Start-Sleep -Seconds 2
  & $StackScript -Action start | Out-Null
}

Remove-Item $LockFile -Force -ErrorAction SilentlyContinue
