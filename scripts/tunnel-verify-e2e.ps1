#Requires -Version 5.1
$ErrorActionPreference = "Stop"
$ProjectRoot = "C:\proyectos\logitrainerstudio"
Set-Location $ProjectRoot

Write-Host "`n=== LogiTrainer — túnel + E2E unificado ===" -ForegroundColor Cyan

$stack = Join-Path $ProjectRoot "scripts\tunnel-stack.ps1"
& $stack -Action stop | Out-Null
Start-Sleep -Seconds 2
$url = (& $stack -Action start 2>&1 | Out-String)
Start-Sleep -Seconds 3
$url = (& $stack -Action url | Select-Object -Last 1).ToString().Trim()

if (-not $url -or $url -notmatch '^https://') { throw "Sin URL de túnel" }
$base = $url.Trim().TrimEnd('/')
$login = "$base/studio/login"

Write-Host "URL túnel: $base" -ForegroundColor Green
Set-Content -Path (Join-Path $ProjectRoot "TRYCLOUDFLARE-URL.txt") -Value @"
LogiTrainer Studio — Túnel (localhost:8080)
Actualizado: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

URL: $base
Studio: $base/studio
Classic: $base/classic
Contraseña: LTS-Mayo2026-7kQ!
"@ -Encoding UTF8
Set-Content -Path (Join-Path $ProjectRoot ".cloudflared\quick-tunnel-url.txt") -Value $base -Encoding UTF8

Write-Host "Comprobando $login ..." -ForegroundColor Cyan
$ok = $false
Start-Sleep -Seconds 15
foreach ($i in 1..60) {
  try {
    $r = Invoke-WebRequest -Uri $login -UseBasicParsing -TimeoutSec 30
    if ($r.StatusCode -eq 200) { $ok = $true; break }
  } catch { Start-Sleep -Seconds 4 }
}
if (-not $ok) { throw "Túnel no responde 200 en $login" }
Write-Host "HTTP 200 OK (studio/login)" -ForegroundColor Green

foreach ($path in @("/classic", "/")) {
  $checkUrl = "$base$path"
  try {
    $r2 = Invoke-WebRequest -Uri $checkUrl -UseBasicParsing -TimeoutSec 30
    if ($r2.StatusCode -ne 200) { throw "HTTP $($r2.StatusCode) en $checkUrl" }
    Write-Host "HTTP 200 OK ($path)" -ForegroundColor Green
  } catch {
    throw "Túnel no responde en $checkUrl : $_"
  }
}

# Playwright contra localhost (mismo Vite que el túnel); el túnel ya validó HTTP 200 arriba.
$env:PLAYWRIGHT_BASE_URL = "http://127.0.0.1:8080"
$env:STUDIO_ACCESS_PASSWORD = "LTS-Mayo2026-7kQ!"
Write-Host "Playwright E2E: http://127.0.0.1:8080 (túnel público: $base)" -ForegroundColor Cyan

$specs = @(
  "tests/e2e/studio-hub.spec.ts",
  "tests/e2e/site-access.spec.ts",
  "tests/e2e/classic-studio.spec.ts"
)

npx playwright test @specs --reporter=line --workers=1
$exitCode = $LASTEXITCODE

Remove-Item Env:PLAYWRIGHT_BASE_URL -ErrorAction SilentlyContinue
Remove-Item Env:STUDIO_ACCESS_PASSWORD -ErrorAction SilentlyContinue

if ($exitCode -ne 0) { throw "E2E falló (exit $exitCode)" }

Write-Host "`n=== TODO OK: túnel + E2E unificado ===" -ForegroundColor Green
Write-Host "Pro:     $base/" -ForegroundColor Green
Write-Host "Classic: $base/classic" -ForegroundColor Green
Write-Host "Hub:     $base/studio" -ForegroundColor Green
