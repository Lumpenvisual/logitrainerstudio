#Requires -Version 5.1
<#
  Reconfigura tareas LogiTrainerStudio para cero ventanas (wscript + procesos sin consola).
  Uso: npm run tunnel:silence
       npm run tunnel:silence -- -DisableWatchdog
#>
param([switch]$DisableWatchdog)

$ErrorActionPreference = "Stop"
$ProjectRoot = "C:\proyectos\logitrainerstudio"
. (Join-Path $PSScriptRoot "tunnel-helpers.ps1")

$StackStartScript = Join-Path $ProjectRoot "scripts\tunnel-stack-start.ps1"
$WatchdogScript = Join-Path $ProjectRoot "scripts\tunnel-watchdog.ps1"
$TaskStack = "LogiTrainerStudio-TunnelStack"
$TaskWatchdog = "LogiTrainerStudio-TunnelWatchdog"

$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
  -StartWhenAvailable -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1)

$actionStart = New-LtsHiddenTaskAction -ProjectRoot $ProjectRoot -ScriptPath $StackStartScript
$triggerLogon = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
Register-LtsHiddenScheduledTask -TaskName $TaskStack -Action $actionStart -Trigger @($triggerLogon) `
  -RunLevel Limited -Settings $settings
Write-Host "Tarea $TaskStack -> wscript oculto (sin ventana negra)." -ForegroundColor Green

if ($DisableWatchdog) {
  Disable-ScheduledTask -TaskName $TaskWatchdog -ErrorAction SilentlyContinue
  Write-Host "Watchdog desactivado." -ForegroundColor Cyan
} else {
  $actionWatch = New-LtsHiddenTaskAction -ProjectRoot $ProjectRoot -ScriptPath $WatchdogScript
  $triggerWatch = New-ScheduledTaskTrigger -Once -At (Get-Date) `
    -RepetitionInterval (New-TimeSpan -Minutes 5) -RepetitionDuration (New-TimeSpan -Days 3650)
  Register-LtsHiddenScheduledTask -TaskName $TaskWatchdog -Action $actionWatch -Trigger @($triggerWatch) `
    -RunLevel Limited -Settings $settings
  Write-Host "Tarea $TaskWatchdog -> wscript oculto (cada 5 min)." -ForegroundColor Green
}

Write-Host "`nSi aún ves una ventana vacía: npm run tunnel:disable" -ForegroundColor Yellow
