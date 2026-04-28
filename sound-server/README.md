# MaestroAI Local Sound Server

This server is the local sound-generation runtime for MaestroAI.

## Current phase

- `mock` engine: immediately runnable WAV generator for full pipeline validation.
- `ace_step` engine: reserved slot for real ACE-Step integration.

## Start

```powershell
cd E:\2026\maestro-ai\sound-server
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe app.py
```

Server URL:

```text
http://127.0.0.1:8765
```

Health check:

```text
http://127.0.0.1:8765/api/sound/health
```

## MaestroAI test flow

1. Start this server.
2. Start MaestroAI dev server.
3. Import a song.
4. Go to `Arrange`.
5. Click `Prepare Busking Version`.
6. Set engine to `Local Sound Server`.
7. Click `Check`.
8. Click `Generate Maestro Sound`.
9. Go to `Backing`.
10. Click `Load Generated Maestro Sound` and Play.

## Next phase

Replace `engines/ace_step_engine.py` with a real model call that writes `master.wav` or stems to `outputs/` and returns the generated file metadata.
