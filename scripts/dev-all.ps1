param(
    [switch]$NoInstall,
    [switch]$ShowSoundServer
)

$ErrorActionPreference = 'Stop'
$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$soundDir = Join-Path $root 'sound-server'
$venvPython = Join-Path $soundDir '.venv\Scripts\python.exe'
$pidDir = Join-Path $root '.runtime'
$soundPidFile = Join-Path $pidDir 'sound-server.pid'
$acePidFile = Join-Path $pidDir 'ace-step.pid'
$soundOutLog = Join-Path $pidDir 'sound-server.out.log'
$soundErrLog = Join-Path $pidDir 'sound-server.err.log'

function Write-Step([string]$message) {
    Write-Host "[maestro-dev] $message" -ForegroundColor Cyan
}

function Test-Port([int]$port) {
    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $iar = $client.BeginConnect('127.0.0.1', $port, $null, $null)
        $ok = $iar.AsyncWaitHandle.WaitOne(250, $false)
        if ($ok) { $client.EndConnect($iar) }
        $client.Close()
        return $ok
    } catch {
        return $false
    }
}

function Get-PortPids([int]$port) {
    $pids = New-Object System.Collections.Generic.List[int]
    $lines = netstat -ano -p tcp | Select-String ":$port"
    foreach ($line in $lines) {
        $text = $line.ToString().Trim()
        if ($text -match "LISTENING\s+(\d+)$") {
            $pidValue = [int]$Matches[1]
            if ($pidValue -gt 0 -and -not $pids.Contains($pidValue)) {
                $pids.Add($pidValue)
            }
        }
    }
    return $pids.ToArray()
}

function Show-PortDiagnostics([int]$port) {
    Write-Host "[maestro-dev] Port $port diagnostics:" -ForegroundColor Yellow
    netstat -ano -p tcp | findstr ":$port" | Out-Host
    $pids = Get-PortPids $port
    foreach ($pidValue in $pids) {
        try {
            Get-CimInstance Win32_Process -Filter "ProcessId=$pidValue" |
                Select-Object ProcessId, Name, ExecutablePath, CommandLine |
                Format-List | Out-Host
        } catch {
            Write-Host "[maestro-dev] Could not inspect PID=$pidValue" -ForegroundColor Yellow
        }
    }
}

function Stop-PortListeners([int]$port, [string]$name) {
    $pids = Get-PortPids $port
    foreach ($pidValue in $pids) {
        Write-Step "Stopping $name listener on port $port, PID=$pidValue..."
        try {
            & taskkill.exe /PID $pidValue /T /F | Out-Null
        } catch {
            Stop-Process -Id $pidValue -Force -ErrorAction SilentlyContinue
        }
    }
    Start-Sleep -Milliseconds 800
}

function Wait-Port([int]$port, [int]$timeoutSeconds) {
    $deadline = (Get-Date).AddSeconds($timeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        if (Test-Port $port) { return $true }
        Start-Sleep -Milliseconds 300
    }
    return $false
}

function Ensure-PidDir() {
    if (-not (Test-Path $pidDir)) {
        New-Item -ItemType Directory -Force -Path $pidDir | Out-Null
    }
}

function Get-SoundServerHealth() {
    try {
        return Invoke-RestMethod -Uri 'http://127.0.0.1:8765/api/sound/health' -TimeoutSec 2
    } catch {
        return $null
    }
}

function Write-SoundServerHealth() {
    $health = Get-SoundServerHealth
    if ($null -eq $health) {
        Write-Host '[maestro-dev] Sound server health: not available.' -ForegroundColor Yellow
        return
    }
    Write-Host '[maestro-dev] Sound server health:' -ForegroundColor Yellow
    $health | ConvertTo-Json -Depth 10 | Out-Host
}

function Is-SoundServerCurrent() {
    $health = Get-SoundServerHealth
    if ($null -eq $health) { return $false }
    $enginesText = ($health.engines -join ',')
    if ($health.version -ne '0.3.0') { return $false }
    if ($health.defaultEngine -ne 'performance_pack') { return $false }
    if (-not $enginesText.Contains('performance_pack')) { return $false }
    return $true
}

function Ensure-SoundServerVenv() {
    if ($NoInstall) { return }
    if (-not (Test-Path $venvPython)) {
        Write-Step 'Creating sound-server virtual environment...'
        Push-Location $soundDir
        try {
            py -3 -m venv .venv
        } finally {
            Pop-Location
        }
    }

    Write-Step 'Checking sound-server requirements...'
    Push-Location $soundDir
    try {
        & $venvPython -m pip install --upgrade pip | Out-Null
        & $venvPython -m pip install -r requirements.txt | Out-Null
    } finally {
        Pop-Location
    }
}

function Start-SoundServer() {
    if (Test-Port 8765) {
        if (Is-SoundServerCurrent) {
            Write-Step 'Sound server 0.3.0 already running on 127.0.0.1:8765.'
            return
        }
        Write-Step 'Old or incompatible sound server detected on 127.0.0.1:8765.'
        Write-SoundServerHealth
        Show-PortDiagnostics 8765
        Stop-PortListeners 8765 'MaestroAI Sound Server'
    }

    if (Test-Port 8765) {
        Write-Host 'Port 8765 is still busy after cleanup.' -ForegroundColor Red
        Show-PortDiagnostics 8765
        throw 'Port 8765 cleanup failed.'
    }

    Ensure-SoundServerVenv

    Write-Step 'Starting MaestroAI Sound Server on 127.0.0.1:8765...'
    $windowStyle = if ($ShowSoundServer) { 'Normal' } else { 'Hidden' }
    $process = Start-Process -FilePath $venvPython `
        -ArgumentList @('-m', 'uvicorn', 'app:app', '--host', '127.0.0.1', '--port', '8765') `
        -WorkingDirectory $soundDir `
        -WindowStyle $windowStyle `
        -RedirectStandardOutput $soundOutLog `
        -RedirectStandardError $soundErrLog `
        -PassThru
    Set-Content -Path $soundPidFile -Value $process.Id -Encoding ascii

    if (-not (Wait-Port 8765 20)) {
        Write-Host 'Sound server failed to start.' -ForegroundColor Red
        Write-Host "stdout: $soundOutLog" -ForegroundColor Yellow
        Write-Host "stderr: $soundErrLog" -ForegroundColor Yellow
        if (Test-Path $soundOutLog) { Get-Content $soundOutLog -Tail 30 }
        if (Test-Path $soundErrLog) { Get-Content $soundErrLog -Tail 60 }
        throw 'Sound server startup failed.'
    }
    if (-not (Is-SoundServerCurrent)) {
        Write-Host 'Sound server started but contract is not current.' -ForegroundColor Red
        Write-SoundServerHealth
        Show-PortDiagnostics 8765
        if (Test-Path $soundOutLog) { Get-Content $soundOutLog -Tail 40 }
        if (Test-Path $soundErrLog) { Get-Content $soundErrLog -Tail 80 }
        Stop-PortListeners 8765 'MaestroAI Sound Server'
        throw 'Sound server contract mismatch.'
    }
    Write-Step 'Sound server ready: 0.3.0 / performance_pack.'
}

function Start-AceStepIfConfigured() {
    $cmd = $env:ACE_STEP_START_CMD
    if ([string]::IsNullOrWhiteSpace($cmd)) {
        Write-Step 'ACE_STEP_START_CMD not set. Skipping ACE-Step auto-start.'
        return
    }

    if (Test-Port 8001) {
        Write-Step 'ACE-Step API already running on 127.0.0.1:8001.'
        return
    }

    Write-Step 'Starting ACE-Step API using ACE_STEP_START_CMD...'
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = 'powershell.exe'
    $psi.Arguments = "-NoProfile -ExecutionPolicy Bypass -Command `$ErrorActionPreference='Stop'; $cmd"
    $psi.WorkingDirectory = $root
    $psi.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
    $psi.UseShellExecute = $false
    $process = [System.Diagnostics.Process]::Start($psi)
    Set-Content -Path $acePidFile -Value $process.Id -Encoding ascii
    Start-Sleep -Seconds 2
    Write-Step "ACE-Step start command launched. PID=$($process.Id)"
}

Ensure-PidDir
Start-SoundServer
Start-AceStepIfConfigured

Write-Step 'Starting Vite app on http://localhost:5173 ...'
Push-Location $root
try {
    npm run dev
} finally {
    Pop-Location
}
