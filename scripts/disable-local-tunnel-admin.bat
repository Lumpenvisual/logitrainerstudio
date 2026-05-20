@echo off
:: Desactiva tareas del túnel (incl. TunnelStack con privilegios elevados).
net session >nul 2>&1
if %errorLevel% neq 0 (
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs -Wait"
  exit /b %errorLevel%
)
cd /d "%~dp0.."
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0disable-local-tunnel.ps1"
pause
