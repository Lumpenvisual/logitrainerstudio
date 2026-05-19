#Requires -Version 5.1
<#
  Publica LogiTrainer Studio en trycloudflare.com (Quick Tunnel) con persistencia local.

  Uso (PowerShell como Administrador para tarea programada):
    cd C:\proyectos\logitrainerstudio
    .\scripts\publish-trycloudflare.ps1

  La URL *.trycloudflare.com es estable mientras cloudflared siga en ejecución.
  Tras reinicio del PC puede cambiar — el watchdog la actualiza en .cloudflared\quick-tunnel-url.txt
#>
param([switch]$SkipTask)

$ErrorActionPreference = "Stop"
$ProjectRoot = "C:\proyectos\logitrainerstudio"
$StackScript = Join-Path $ProjectRoot "scripts\tunnel-stack.ps1"
$WatchdogScript = Join-Path $ProjectRoot "scripts\tunnel-watchdog.ps1"
$TaskStack = "LogiTrainerStudio-TunnelStack"
$TaskWatchdog = "LogiTrainerStudio-TunnelWatchdog"
$UrlFile = Join-Path $ProjectRoot ".cloudflared\quick-tunnel-url.txt"
$PublicInfo = Join-Path $ProjectRoot "TRYCLOUDFLARE-URL.txt"

function Refresh-Path {
  $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
    [System.Environment]::GetEnvironmentVariable("Path", "User")
}
Refresh-Path

$env:LTS_TUNNEL_MODE = "quick"

if (-not (Get-Command cloudflared -ErrorAction SilentlyContinue)) {
  & (Join-Path $ProjectRoot "scripts\install-cloudflared.ps1")
  Refresh-Path
}

Write-Host "`n=== Publicando en trycloudflare.com ===" -ForegroundColor Cyan
$healthOk = $false
try {
  $u = (Get-Content $UrlFile -Raw -ErrorAction SilentlyContinue).Trim()
  if ($u) {
    $r = Invoke-WebRequest -Uri "$u/studio/login" -UseBasicParsing -TimeoutSec 12
    $healthOk = $r.StatusCode -eq 200
  }
} catch { $healthOk = $false }

if (-not $healthOk) {
  & $StackScript -Action stop | Out-Null
  Start-Sleep -Seconds 2
  & $StackScript -Action start | Out-Null
  Start-Sleep -Seconds 3
} else {
  Write-Host "Stack ya saludable — conservando URL actual." -ForegroundColor Yellow
}

$url = (& $StackScript -Action url | Select-Object -Last 1).ToString().Trim()
if ($url -notmatch '^https://') { throw "No se obtuvo URL pública" }

$studio = "$url/studio"
$info = @"
LogiTrainer Studio — Quick Tunnel (Cloudflare)
Actualizado: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

URL pública:  $url
Login Studio:   $studio
Contraseña:   LTS-Mayo2026-7kQ!

Persistencia: tareas Windows + watchdog cada 5 min.
Ver: docs/CLOUDFLARE-TUNNEL.md
"@
$info | Set-Content $PublicInfo -Encoding UTF8
$url | Set-Content $UrlFile -Encoding UTF8

Write-Host $info -ForegroundColor Green

if (-not $SkipTask) {
  $isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator)
  if (-not $isAdmin) {
    Write-Host "`nRe-ejecuta como Administrador para instalar persistencia automática." -ForegroundColor Yellow
  } else {
    foreach ($t in @($TaskStack, $TaskWatchdog)) {
      Unregister-ScheduledTask -TaskName $t -Confirm:$false -ErrorAction SilentlyContinue
    }
    $actionStart = New-ScheduledTaskAction -Execute "powershell.exe" `
      -Argument "-NoProfile -ExecutionPolicy Bypass -Command `"`$env:LTS_TUNNEL_MODE='quick'; & '$StackScript' -Action start`"" `
      -WorkingDirectory $ProjectRoot
    $triggerLogon = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
      -StartWhenAvailable -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1)
    Register-ScheduledTask -TaskName $TaskStack -Action $actionStart -Trigger $triggerLogon `
      -Settings $settings -RunLevel Highest -Force | Out-Null

    $actionWatch = New-ScheduledTaskAction -Execute "powershell.exe" `
      -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$WatchdogScript`"" `
      -WorkingDirectory $ProjectRoot
    $triggerWatch = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 5) -RepetitionDuration (New-TimeSpan -Days 3650)
    Register-ScheduledTask -TaskName $TaskWatchdog -Action $actionWatch -Trigger $triggerWatch `
      -Settings $settings -RunLevel Limited -Force | Out-Null

    Start-ScheduledTask -TaskName $TaskStack -ErrorAction SilentlyContinue
    Write-Host "Tareas persistentes: $TaskStack, $TaskWatchdog (cada 5 min)" -ForegroundColor Green
  }
}

Write-Host "`nVerificando HTTP..." -ForegroundColor Cyan
$r = Invoke-WebRequest -Uri "$studio/login" -UseBasicParsing -TimeoutSec 30
if ($r.StatusCode -ne 200) { throw "Health check falló" }
Write-Host "HTTP 200 OK — publicado." -ForegroundColor Green
