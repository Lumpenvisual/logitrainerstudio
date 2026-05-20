#Requires -Version 5.1
<#
  Detiene ventanas negras: desactiva tareas LogiTrainerStudio-* y mata procesos del túnel local.
  Uso: npm run tunnel:disable
#>
$ErrorActionPreference = "SilentlyContinue"
$ProjectRoot = "C:\proyectos\logitrainerstudio"

$taskNames = @(
  "LogiTrainerStudio-TunnelStack",
  "LogiTrainerStudio-TunnelWatchdog",
  "LogiTrainerStudio-Vite"
)
foreach ($name in $taskNames) {
  try {
    Disable-ScheduledTask -TaskName $name -ErrorAction Stop
    Write-Host "Tarea desactivada: $name" -ForegroundColor Green
  } catch {
    Write-Host "No se pudo desactivar $name (¿ejecutar disable-local-tunnel-admin.bat como admin?): $($_.Exception.Message)" -ForegroundColor Yellow
  }
}

# TunnelStack suele estar en RunLevel Highest: reemplazar por tarea sin ventana o eliminarla
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
  [Security.Principal.WindowsBuiltInRole]::Administrator)
if ($isAdmin) {
  . (Join-Path $PSScriptRoot "tunnel-helpers.ps1")
  Unregister-ScheduledTask -TaskName "LogiTrainerStudio-TunnelStack" -Confirm:$false -ErrorAction SilentlyContinue
  Write-Host "Tarea TunnelStack eliminada (admin). Usa npm run tunnel:silence para recrearla sin ventana." -ForegroundColor Green
}

& (Join-Path $ProjectRoot "scripts\tunnel-stack.ps1") -Action stop 2>$null

foreach ($procName in @("cloudflared", "cmd")) {
  Get-Process -Name $procName -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
}

$on8080 = Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue |
  Select-Object -ExpandProperty OwningProcess -Unique
foreach ($procId in $on8080) {
  Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
}

Write-Host "`nTúnel local detenido. La app sigue en https://logitrainerstudio.vercel.app" -ForegroundColor Cyan
Write-Host "Para reactivar sin ventanas: npm run tunnel:silence (como admin) y npm run tunnel:stack" -ForegroundColor Yellow
