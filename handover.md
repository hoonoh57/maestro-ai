# MaestroAI Session Handover

Last updated: 2026-04-29

## 1. Current Product Direction

MaestroAI is no longer positioned as a simple GP/score viewer or a toy AI sound generator. The product direction has been corrected as follows:

```text
MaestroAI = score editor/player + practice tool + performance backing tool in one product.

Base product value:
- Open/import GP score.
- Edit/inspect/practice the score.
- Generate or play a usable backing/performance track without requiring GPU.
- Use the same project state across Editor / Arrange / Practice / Backing / Busking / Mixer / Test.

Advanced product value:
- AI-assisted arrangement.
- AI-generated performance master/stems.
- Future integration with ACE-Step, cloud AI, external studio runtime, VST3/Pedalboard/NAM/amp-sim chains.
```

Critical conclusion from this session:

```text
GPU-only or AI-only playback is unacceptable as a product base.
The default engine must work on CPU and must provide practical score playback/practice/backing value.
AI engines are advanced extensions, not the foundation.
```

The new base engine is:

```text
Maestro Performance Pack
= CPU-first backing/performance rendering engine.
```

ACE-Step remains in the architecture, but as an advanced AI generation option.

---

## 2. What Works Now

### 2.1 App Shell and Main Modes

The React/Vite app opens at:

```text
http://localhost:5173
```

Implemented modes/tabs include:

```text
Editor
Arrange
Practice
Backing
Busking
Mixer
Test
```

The core shell can show the score, side tracks, inspector, and mode panels.

### 2.2 GP Import and Score Display

The app can import GP files and display alphaTab-rendered notation/tab. Basic alphaTab playback works with SoundFont, although the quality is still not product-grade.

Known issue context:

```text
alphaTab/SoundFont playback is suitable only as a basic score/practice player, not as performance-grade sound.
```

### 2.3 Arrange Workflow

The Arrange tab can generate a busking/performance arrangement plan.

Current workflow:

```text
GP import
→ Arrange tab
→ Prepare Busking Version
→ Arrangement plan generated
→ Section plan generated
→ Practice loops generated
→ Busking cues generated
→ Maestro Sound / Performance Sound prompt generated
```

Goals available in Arrange:

```text
Solo Acoustic
Vocal + Guitar
Full Band
Easy Practice
Stage Performance
```

### 2.4 RenderCache Concept

The project has `renderCache` state used to share generated audio between:

```text
Arrange
Backing
Practice
Busking
```

Successful render flow should be:

```text
Generate Performance Sound
→ sound-server creates WAV
→ returned fileUrl is registered in RenderCache
→ Backing can load the generated master
→ Practice/Busking can use the same RenderCache state
```

### 2.5 Backing Mode

Backing mode supports:

```text
Import MP3 / WAV / MR
Load Generated Maestro Sound
Load RenderCache Master
Play / Pause / Stop
Master volume
Speed / pitch preserve
A-B loop
```

Important bug fixed:

```text
Remote generated WAV URLs from 127.0.0.1:8765 were previously passed directly to <audio>.
This caused cases where filename and duration loaded but no sound played.
Now the app fetches remote generated audio, converts it to a browser Blob, and plays blob: URL.
This makes generated audio playback behave like imported local files.
```

### 2.6 Test Console

TestConsole exists and validates app state, arranger workflow, RenderCache contract, alphaTab player state, track controls, persistence format, feature flags, and UI presence.

Current TestConsole still needs to be updated to expect `performance_pack` as the default engine. It previously expected `mock` in one test. This is a next-step item.

---

## 3. Sound Runtime Architecture

There are currently three runtime layers:

```text
1. MaestroAI React app
   URL: http://localhost:5173

2. MaestroAI Local Sound Server
   URL: http://127.0.0.1:8765
   Path: sound-server/app.py
   Role: routing layer between app and sound engines.

3. Optional external/AI sound engines
   Example: ACE-Step API server
   Default expected URL: http://127.0.0.1:8001
```

Important clarification:

```text
The user must not be expected to manually run several terminals in the final product.
For development, npm run dev:all now starts the MaestroAI sound server automatically.
For product packaging, sound-runtime must be hidden/auto-managed or bundled.
```

---

## 4. One-Command Development Flow

New scripts were added:

```text
scripts/dev-all.ps1
scripts/stop-dev.ps1
```

package.json now includes:

```json
{
  "dev:all": "powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dev-all.ps1",
  "stop:dev": "powershell -NoProfile -ExecutionPolicy Bypass -File scripts/stop-dev.ps1"
}
```

Recommended development start:

```powershell
cd E:\2026\maestro-ai
git pull origin main
npm install
npm run stop:dev
npm run dev:all
```

Recommended stop:

```powershell
cd E:\2026\maestro-ai
npm run stop:dev
```

`dev-all.ps1` behavior:

```text
1. Ensures .runtime folder.
2. Ensures sound-server virtual environment.
3. Installs sound-server requirements.
4. Checks port 8765.
5. If an old/incompatible sound server is already running, it stops it.
6. Starts current MaestroAI Sound Server hidden/background.
7. Verifies sound-server contract is current.
8. Optionally starts ACE-Step if ACE_STEP_START_CMD is set.
9. Starts Vite dev server.
```

Current expected sound server contract:

```json
{
  "ok": true,
  "name": "MaestroAI Local Sound Server",
  "version": "0.3.0",
  "engines": ["performance_pack", "ace_step", "mock", "local_ai", "external_runtime"],
  "defaultEngine": "performance_pack",
  "outputBaseUrl": "/outputs"
}
```

Critical bug fixed:

```text
Previously, if old sound-server 0.2.0 was already running on port 8765, dev-all.ps1 reused it.
This caused: Unknown sound engine: performance_pack.
Now dev-all.ps1 checks version/defaultEngine/engine list and restarts stale servers automatically.
```

---

## 5. Current Sound Engines

### 5.1 Maestro Performance Pack — default/base engine

Engine id:

```text
performance_pack
```

Status:

```text
Implemented as initial CPU WAV renderer in sound-server/engines/performance_pack_engine.py
```

Current v1 behavior:

```text
- Uses BPM/key from arrangement plan.
- Generates a basic performance/backing WAV.
- Synthesizes simple drums: kick, snare, hi-hat.
- Synthesizes bass.
- Synthesizes guitar pluck pattern.
- Synthesizes pad/chord bed.
- Applies simple saturation/limiter.
- If Pedalboard + numpy are installed, applies CPU audio post-processing chain:
  high-pass, low-pass, compressor, reverb, gain, limiter.
- If Pedalboard is not installed, fallback still works.
```

File:

```text
sound-server/engines/performance_pack_engine.py
```

Current limitation:

```text
This is not yet a real RSE/DAW-quality engine.
It is a CPU-first scaffold showing that the product can generate backing audio without GPU.
It still needs real track-note extraction, sample/VST/SFZ integration, and instrument-specific rendering.
```

### 5.2 Browser Mock

Engine id:

```text
mock
```

Purpose:

```text
Quick browser-side pipeline validation.
```

File:

```text
src/services/sound/MockMaestroSoundEngine.ts
```

### 5.3 Local Server Mock

Engine id:

```text
local_ai
```

Purpose:

```text
Server-side pipeline validation without actual AI.
```

Uses:

```text
sound-server/engines/mock_engine.py
```

### 5.4 ACE-Step AI

Engine id:

```text
ace_step
```

Status:

```text
Adapter implemented, actual ACE-Step runtime not installed/validated yet.
```

File:

```text
sound-server/engines/ace_step_engine.py
```

Current adapter flow:

```text
ACE-Step API server health check
→ POST /v1/music/generate
→ GET /v1/jobs/{job_id} polling
→ GET /v1/audio?path=... download
→ save output WAV into sound-server/outputs
→ return RenderCache-compatible metadata
```

Expected external API URL:

```text
http://127.0.0.1:8001
```

Config via env:

```powershell
$env:ACE_STEP_API_URL="http://127.0.0.1:8001"
$env:ACE_STEP_TIMEOUT_SECONDS="900"
$env:ACE_STEP_POLL_INTERVAL_SECONDS="2.0"
$env:ACE_STEP_INFERENCE_STEPS="16"
$env:ACE_STEP_GUIDANCE_SCALE="7.0"
$env:ACE_STEP_SEED="-1"
$env:ACE_STEP_THINKING="true"
```

Important product decision:

```text
ACE-Step is not the default product engine.
It is an advanced AI generation option for GPU/cloud/external runtime users.
```

### 5.5 External Runtime

Engine id:

```text
external_runtime
```

Currently routed to mock for validation. Reserved for future engines.

---

## 6. Important Files Changed/Added in This Session

### React / TypeScript

```text
src/services/sound/MaestroSoundEngineTypes.ts
src/services/sound/SoundServerClient.ts
src/services/sound/LocalMaestroSoundEngine.ts
src/services/sound/MockMaestroSoundEngine.ts
src/stores/soundEngineStore.ts
src/components/sound/MaestroSoundPanel.tsx
src/components/arranger/BuskingArrangePanel.tsx
src/components/inspector/BackingInspector.tsx
src/components/modes/TestConsole.tsx
src/components/shared/AppErrorBoundary.tsx
src/main.tsx
```

### Python Sound Server

```text
sound-server/app.py
sound-server/requirements.txt
sound-server/README.md
sound-server/engines/mock_engine.py
sound-server/engines/ace_step_engine.py
sound-server/engines/performance_pack_engine.py
sound-server/outputs/
```

### Scripts

```text
scripts/dev-all.ps1
scripts/stop-dev.ps1
```

### Docs

```text
handover.md
```

---

## 7. Current Known Issue from Latest Screenshot

Latest screenshot showed:

```text
Runtime: MaestroAI Local Sound Server 0.2.0 / engines: ace_step, mock, local_ai, external_runtime
Error: Unknown sound engine: performance_pack
```

Cause:

```text
Old sound-server 0.2.0 was still running on port 8765.
The React app was updated to request performance_pack, but old server did not know this engine.
```

Fix implemented:

```text
scripts/dev-all.ps1 now checks health contract and stops stale 8765 process automatically.
```

Next-session first validation:

```powershell
cd E:\2026\maestro-ai
git pull origin main
npm run stop:dev
npm run dev:all
```

Then in the app:

```text
Arrange → Check
```

Expected:

```text
Runtime: MaestroAI Local Sound Server 0.3.0 / engines: performance_pack, ace_step, mock, local_ai, external_runtime
```

If still 0.2.0 appears, manually identify and kill port 8765 process:

```powershell
netstat -ano | findstr :8765
taskkill /PID <PID> /F
npm run dev:all
```

---

## 8. Immediate Next Test Plan

### Test A — Runtime contract

```powershell
cd E:\2026\maestro-ai
npm run stop:dev
npm run dev:all
```

Browser:

```text
http://localhost:5173
```

In Arrange:

```text
Check
```

Expected:

```text
Sound runtime OK / version 0.3.0 / default performance_pack
```

Also check:

```text
http://127.0.0.1:8765/api/sound/health
```

Expected JSON:

```json
{
  "version": "0.3.0",
  "defaultEngine": "performance_pack"
}
```

### Test B — Performance Pack render

In app:

```text
1. Import GP file.
2. Arrange tab.
3. Prepare Busking Version.
4. Engine = Maestro Performance Pack.
5. Generate Performance Sound.
6. RenderCache should become ready.
7. Backing tab.
8. Load Generated Maestro Sound.
9. Play.
```

Expected output file:

```text
sound-server/outputs/performance_pack_*.wav
```

### Test C — Pedalboard enhancement

Install optional Pedalboard:

```powershell
cd E:\2026\maestro-ai\sound-server
.\.venv\Scripts\python.exe -m pip install pedalboard numpy
```

Then restart:

```powershell
cd E:\2026\maestro-ai
npm run stop:dev
npm run dev:all
```

Render again and compare audio.

### Test D — TestConsole update

TestConsole likely still has a stale expectation:

```text
sound_engine_store expects mock engine
```

Update it to expect:

```text
performance_pack
```

Then run:

```text
Test → Run All Tests
```

---

## 9. Immediate Implementation Priorities

### Priority 1 — Stabilize Performance Pack default flow

Goal:

```text
GP import → Arrange → Generate Performance Sound → Backing play
```

must work without manual server confusion.

Tasks:

```text
1. Verify sound-server 0.3.0 starts.
2. Verify performance_pack route works.
3. Verify generated WAV is playable from Backing.
4. Update TestConsole default engine expectation.
5. Add a TestConsole test that checks server health includes performance_pack.
```

### Priority 2 — Replace synthetic pattern with score-aware rendering

Current Performance Pack v1 generates a generic key/BPM pattern. Next version must use score information.

Needed:

```text
1. Extract track roles from imported GP score:
   guitar, bass, drums, keys, vocal/lead, pad.

2. Extract note events or MIDI-like events from alphaTab score.

3. Send event data to sound-server payload:
   tracks[]
   notes[]
   tempo map
   time signature
   articulations if available

4. Render based on actual score rhythm/notes, not generic loop.
```

Potential route:

```text
alphaTab score → internal event extraction → JSON payload → performance_pack_engine.py
```

Fallback route:

```text
GP file → server-side PyGuitarPro extraction
```

### Priority 3 — Pedalboard/VST3/NAM track engine

Pedalboard should become the CPU post-processing and VST host layer.

Target design:

```text
Performance Pack v2/v3:

Track Renderer:
- Guitar dry synth/sample/audio source.
- Bass synth/sample/audio source.
- Drum sample renderer.
- Keys/pad renderer.

Pedalboard Chain:
- Compressor
- Amp/Cabinet plugin or VST3
- EQ filters
- Reverb/Delay
- Limiter

External plugin path:
- VST3 scan/config
- NAM plugin or standalone model support
- Cabinet IR path
```

User-provided insight:

```text
Pedalboard can host VST3/AU plugins and process high-quality guitar chains on CPU.
This can support Neural Amp Modeler, Ample Guitar, Neural DSP, AmpliTube, Guitar Rig, etc.
```

Product rule:

```text
The base app must work without users manually importing high-quality finished audio.
Optional plugins and AI engines improve quality but must not be required for basic product value.
```

### Priority 4 — Package runtime invisibly

Development now uses:

```text
npm run dev:all
```

Product must use:

```text
MaestroAI.exe
```

with hidden runtime management:

```text
- Start local sound runtime automatically.
- Stop runtime automatically.
- Hide ports/server details from normal users.
- Show only Ready / Rendering / Error.
```

The UI should eventually hide Local Runtime URL under Advanced/Developer Settings.

### Priority 5 — AI expansion remains intact

ACE-Step/Cloud/External Runtime should remain selectable, but not primary.

Future structure:

```text
Base:
- Maestro Performance Pack

Advanced:
- AI Maestro Sound - ACE-Step
- Cloud AI
- External Runtime
- Future custom MaestroAI model
```

---

## 10. Recommended Next-Session Prompt

Use this to continue:

```text
Continue from handover.md. First validate that dev-all starts sound-server 0.3.0 with performance_pack. Then fix TestConsole default-engine expectations, add performance_pack server health/render tests, and verify GP import → Arrange → Generate Performance Sound → Backing playback. After that, start Performance Pack v2 by extracting actual score/track note events instead of generating a generic loop.
```

---

## 11. Hard Product Principles Going Forward

1. The product must not depend on GPU for basic usage.
2. The user must not manually run Python/servers/ports in final UX.
3. Basic score editing/practice/backing playback must work immediately after import.
4. AI sound generation is a premium/advanced path, not the base path.
5. The default sound must move toward backing-machine quality, not SoundFont toy quality.
6. RenderCache is the product bridge between arrangement, backing, practice, and busking.
7. Pedalboard/VST3/NAM/SFZ/Sample Pack support is the practical CPU-first path to stronger sound.
8. ACE-Step and other AI engines remain valuable for style generation/master/stem creation, but must be layered above the CPU Performance Pack.
9. Every new feature must have a visible test route in the UI or TestConsole.
10. Avoid developer-only UI leaking into product UI; hide runtime details under Advanced Settings later.
