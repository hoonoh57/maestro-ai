$ErrorActionPreference = 'Continue'
$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$pidDir = Join-Path $root '.runtime'
$soundPidFile = Join-Path $pidDir 'sound-server.pid'
$acePidFile = Join-Path $pidDir 'ace-step.pid'

function Stop-FromPidFile([string]$path, [string]$name) {
    if (-not (Test-Path $path)) {
        Write-Host "[maestro-dev] $name pid file not found."
        return
    }

    $raw = Get-Content $path -ErrorAction SilentlyContinue | Select-Object -First 1
    $pidValue = 0
    if (-not [int]::TryParse($raw, [ref]$pidValue)) {
        Remove-Item $path -Force -ErrorAction SilentlyContinue
        return
    }

    $process = Get-Process -Id $pidValue -ErrorAction SilentlyContinue
    if ($null -ne $process) {
        Write-Host "[maestro-dev] Stopping $name PID=$pidValue..." -ForegroundColor Cyan
        Stop-Process -Id $pidValue -Force -ErrorAction SilentlyContinue
    } else {
        Write-Host "[maestro-dev] $name PID=$pidValue is not running."
    }
    Remove-Item $path -Force -ErrorAction SilentlyContinue
}

Stop-FromPidFile $soundPidFile 'MaestroAI Sound Server'
Stop-FromPidFile $acePidFile 'ACE-Step API'

Write-Host '[maestro-dev] Done.' -ForegroundColor Green
