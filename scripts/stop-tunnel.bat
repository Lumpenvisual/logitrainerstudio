@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0stop-tunnel.ps1"
exit /b %ERRORLEVEL%
