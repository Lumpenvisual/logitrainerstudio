#Requires -Version 5.1
$ErrorActionPreference = "Stop"
$ProjectRoot = "C:\proyectos\logitrainerstudio"
Set-Location $ProjectRoot

Write-Host "`n=== LogiTrainer — verificación túnel + E2E ===" -ForegroundColor Cyan

$stack = Join-Path $ProjectRoot "scripts\tunnel-stack.ps1"
& $stack -Action stop | Out-Null
& $stack -Action start | Out-Null
Start-Sleep -Seconds 2
$url = (& $stack -Action url | Select-Object -Last 1).ToString().Trim()

if (-not $url -or $url -notmatch '^https://') { throw "Sin URL de túnel" }
$base = $url.ToString().Trim()
$login = "$base/studio/login"

Write-Host "Comprobando $login ..." -ForegroundColor Cyan
$ok = $false
foreach ($i in 1..30) {
  try {
    $r = Invoke-WebRequest -Uri $login -UseBasicParsing -TimeoutSec 20
    if ($r.StatusCode -eq 200) { $ok = $true; break }
  } catch { Start-Sleep -Seconds 2 }
}
if (-not $ok) { throw "Túnel no responde 200 en $login" }
Write-Host "HTTP 200 OK" -ForegroundColor Green

$env:PLAYWRIGHT_BASE_URL = $base
Write-Host "Playwright base: $base" -ForegroundColor Cyan
npx playwright test tests/e2e/studio-hub.spec.ts tests/e2e/site-access.spec.ts --reporter=line
if ($LASTEXITCODE -ne 0) { throw "E2E falló (exit $LASTEXITCODE)" }

Remove-Item Env:PLAYWRIGHT_BASE_URL -ErrorAction SilentlyContinue

Write-Host "`n=== TODO OK: túnel + E2E 4/4 ===" -ForegroundColor Green
Write-Host "URL: $base/studio" -ForegroundColor Green
