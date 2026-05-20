#Requires -RunAsAdministrator
#Requires -Version 5.1
<#
  Persistencia: tarea al inicio de sesión que mantiene Vite + túnel (quick o nombrado).
  Si existe cert.pem + config.yml, intenta primero install-persistent-tunnel.ps1.
#>
$ErrorActionPreference = "Stop"
$ProjectRoot = "C:\proyectos\logitrainerstudio"
$TaskName = "LogiTrainerStudio-TunnelStack"
$ScriptPath = Join-Path $ProjectRoot "scripts\tunnel-stack.ps1"
$CertPath = Join-Path $env:USERPROFILE ".cloudflared\cert.pem"
$ConfigPath = Join-Path $ProjectRoot ".cloudflared\config.yml"

if ((Test-Path $CertPath) -and (Test-Path $ConfigPath)) {
  Write-Host "Login Cloudflare detectado — instalando servicio nombrado..." -ForegroundColor Cyan
  & (Join-Path $ProjectRoot "scripts\install-persistent-tunnel.ps1")
  exit $LASTEXITCODE
}

Write-Host "Instalando tarea persistente (quick/named stack)..." -ForegroundColor Cyan
Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue

. (Join-Path $ProjectRoot "scripts\tunnel-helpers.ps1")
$stackStartScript = Join-Path $ProjectRoot "scripts\tunnel-stack-start.ps1"
$action = New-LtsHiddenTaskAction -ProjectRoot $ProjectRoot -ScriptPath $stackStartScript
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
  -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)
Register-LtsHiddenScheduledTask -TaskName $TaskName -Action $action -Trigger @($trigger) `
  -RunLevel Limited -Settings $settings

Start-ScheduledTask -TaskName $TaskName
Write-Host "Tarea '$TaskName' registrada y arrancada." -ForegroundColor Green
Write-Host "URL en: .cloudflared\quick-tunnel-url.txt (quick tunnel)" -ForegroundColor Yellow
