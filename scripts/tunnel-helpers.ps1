#Requires -Version 5.1
# Utilidades compartidas: tareas programadas sin ventana y Vite sin cmd.exe.

function Get-LtsHiddenPowerShellArgs([string]$InnerArgs) {
  return "-WindowStyle Hidden -NonInteractive -NoProfile -ExecutionPolicy Bypass $InnerArgs"
}

function Get-LtsRunHiddenVbs() {
  return Join-Path (Resolve-Path (Join-Path $PSScriptRoot "..")).Path "scripts\run-hidden.vbs"
}

function Start-LtsProcessNoWindow {
  param(
    [Parameter(Mandatory)][string]$FilePath,
    [string[]]$ArgumentList = @(),
    [string]$WorkingDirectory = $null
  )
  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = $FilePath
  $psi.Arguments = ($ArgumentList -join " ")
  $psi.CreateNoWindow = $true
  $psi.UseShellExecute = $false
  $psi.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
  if ($WorkingDirectory) { $psi.WorkingDirectory = $WorkingDirectory }
  return [System.Diagnostics.Process]::Start($psi)
}

function Start-LtsCloudflaredQuickHidden {
  param(
    [Parameter(Mandatory)][string]$LogFile,
    [string]$WorkingDirectory = $null
  )
  Remove-Item $LogFile -Force -ErrorAction SilentlyContinue
  $args = @{
    FilePath               = "cloudflared"
    ArgumentList           = @("tunnel", "--url", "http://localhost:8080")
    RedirectStandardError  = $LogFile
    WindowStyle            = "Hidden"
    PassThru               = $true
  }
  if ($WorkingDirectory) { $args.WorkingDirectory = $WorkingDirectory }
  return Start-Process @args
}

function Register-LtsHiddenScheduledTask {
  param(
    [Parameter(Mandatory)][string]$TaskName,
    [Parameter(Mandatory)][Microsoft.Management.Infrastructure.CimInstance]$Action,
    [Parameter(Mandatory)][Microsoft.Management.Infrastructure.CimInstance[]]$Trigger,
    [ValidateSet("Limited", "Highest")]
    [string]$RunLevel = "Limited",
    [Microsoft.Management.Infrastructure.CimInstance]$Settings
  )
  if (-not $Settings) {
    $Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
      -StartWhenAvailable -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1)
  }
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
  Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings `
    -RunLevel $RunLevel -Force | Out-Null
  $t = Get-ScheduledTask -TaskName $TaskName
  $t.Settings.Hidden = $true
  Set-ScheduledTask -TaskName $TaskName -Settings $t.Settings | Out-Null
}

function Start-LtsViteHidden {
  param(
    [Parameter(Mandatory)][string]$ProjectRoot
  )
  $node = (Get-Command node -ErrorAction Stop).Source
  $writeInfo = Join-Path $ProjectRoot "scripts\write-tunnel-info.mjs"
  $ensureDemo = Join-Path $ProjectRoot "scripts\ensure-demo.mjs"
  $viteBin = Join-Path $ProjectRoot "node_modules\vite\bin\vite.js"
  if (-not (Test-Path $viteBin)) { throw "Falta node_modules. Ejecuta: npm install" }

  & $node $writeInfo | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "write-tunnel-info.mjs falló" }
  & $node $ensureDemo | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "ensure-demo.mjs falló" }

  return Start-LtsProcessNoWindow -FilePath $node -ArgumentList @($viteBin) -WorkingDirectory $ProjectRoot
}

function New-LtsHiddenTaskAction {
  param(
    [Parameter(Mandatory)][string]$ProjectRoot,
    [Parameter(Mandatory)][string]$ScriptPath
  )
  $vbs = Get-LtsRunHiddenVbs
  return New-ScheduledTaskAction -Execute "wscript.exe" `
    -Argument "//B `"$vbs`" `"$ScriptPath`"" -WorkingDirectory $ProjectRoot
}
