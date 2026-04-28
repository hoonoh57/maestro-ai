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
$soundLog = Join-Path $pidDir 'sound-server.log'

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
        Write-Step 'Sound server already running on 127.0.0.1:8765.'
        return
    }

    Ensure-SoundServerVenv

    Write-Step 'Starting MaestroAI Sound Server on 127.0.0.1:8765...'
    $windowStyle = if ($ShowSoundServer) { 'Normal' } else { 'Hidden' }
    $process = Start-Process -FilePath $venvPython `
        -ArgumentList 'app.py' `
        -WorkingDirectory $soundDir `
        -WindowStyle $windowStyle `
        -RedirectStandardOutput $soundLog `
        -RedirectStandardError $soundLog `
        -PassThru
    Set-Content -Path $soundPidFile -Value $process.Id -Encoding ascii

    if (-not (Wait-Port 8765 20)) {
        Write-Host "Sound server failed to start. Log: $soundLog" -ForegroundColor Red
        if (Test-Path $soundLog) { Get-Content $soundLog -Tail 40 }
        throw 'Sound server startup failed.'
    }
    Write-Step 'Sound server ready.'
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
