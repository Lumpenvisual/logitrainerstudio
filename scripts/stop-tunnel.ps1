#Requires -Version 5.1
$procs = Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue
if (-not $procs) {
  Write-Host "No hay procesos cloudflared en ejecución."
  exit 0
}
$procs | Stop-Process -Force
Write-Host "Túnel detenido ($($procs.Count) proceso(s))." -ForegroundColor Green
