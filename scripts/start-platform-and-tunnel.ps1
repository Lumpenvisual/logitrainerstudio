#Requires -Version 5.1
# Inicia Vite (:8080) en segundo plano y el túnel en primer plano.
$ErrorActionPreference = "Stop"
$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $ProjectRoot

$viteJob = Start-Job -ScriptBlock {
  Set-Location $using:ProjectRoot
  npm run start 2>&1
}

Start-Sleep -Seconds 4
Write-Host "Vite en background (job $($viteJob.Id)). Logs: Receive-Job -Id $($viteJob.Id)" -ForegroundColor Cyan

try {
  & (Join-Path $PSScriptRoot "start-tunnel.ps1")
} finally {
  Stop-Job $viteJob -ErrorAction SilentlyContinue
  Remove-Job $viteJob -Force -ErrorAction SilentlyContinue
}
