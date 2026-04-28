# MaestroAI TODO

This file is the execution checklist. Work must proceed in this order unless a blocking error requires a small repair task.

Status marks:

```text
[ ] Not started
[~] In progress
[x] Done
[!] Blocked / needs decision
```

---

## Phase 0 — Stabilize Current Runtime

### TODO-000 — Pull latest and confirm runnable baseline

- [ ] Run `git pull origin main`.
- [ ] Run `npm run stop:dev`.
- [ ] Run `npm run dev:all`.
- [ ] Confirm web app opens at `http://localhost:5173`.
- [ ] Confirm sound server health is reachable.
- [ ] Confirm no stale `0.2.0` sound server remains.

Exit criteria:

```text
App opens, score area renders, no startup crash.
```

---

### TODO-001 — Disable direct synthesis as default product renderer

- [ ] Rename conceptual role of `performance_pack_engine.py` to Debug Synth / fallback only.
- [ ] Remove it from default user-facing `Generate Performance Sound` path.
- [ ] Keep it only behind a debug/developer option if needed.
- [ ] Prevent broken debug renderer output from appearing as recommended Busking Master.

Exit criteria:

```text
Default user flow no longer depends on the direct Python synthesis renderer.
```

---

### TODO-002 — Restore stable Busking flow

- [ ] Busking page opens without blocking score view.
- [ ] Existing WAV list appears.
- [ ] Clicking a WAV loads it.
- [ ] Play/Pause/Stop work.
- [ ] Score cursor follows master audio at least by ratio sync.
- [ ] Mismatched score/audio warning is visible when needed.

Exit criteria:

```text
User can open a GP score, select a WAV, and play score + audio together.
```

---

## Phase 1 — Modular Busking Refactor

### TODO-010 — Split Busking component

Current large file:

```text
src/components/busking/BuskingWorkflowPanel.tsx
```

Target files:

```text
src/components/busking/BuskingMode.tsx
src/components/busking/BuskingTransportBar.tsx
src/components/busking/MasterAudioLibraryPanel.tsx
src/components/busking/SyncStatusPanel.tsx
src/components/busking/StageCuePanel.tsx
src/components/busking/BuskingEmptyState.tsx
```

- [ ] Create files.
- [ ] Move UI sections without changing behavior.
- [ ] Keep existing props/state behavior equivalent.
- [ ] Verify app compiles.
- [ ] Verify Busking still plays selected WAV.

Exit criteria:

```text
Busking is modular and behavior is preserved.
```

---

### TODO-011 — Add `audioLibraryStore`

Create:

```text
src/stores/audioLibraryStore.ts
```

Responsibilities:

- [ ] Generated/imported master audio list.
- [ ] Current selected master audio.
- [ ] Current GP ↔ master audio link.
- [ ] Metadata loading/saving contract.
- [ ] Refresh from sound server `/api/sound/jobs`.

State shape draft:

```ts
interface MasterAudioItem {
  id: string;
  fileName: string;
  fileUrl: string;
  projectId: string;
  projectName: string;
  source: 'external' | 'alphatab' | 'fluidsynth' | 'vst' | 'ai' | 'debug' | 'legacy';
  durationSeconds: number;
  createdAt: string;
  hasMetadata: boolean;
}
```

Exit criteria:

```text
Busking reads audio list from audioLibraryStore instead of local component state.
```

---

### TODO-012 — Add `buskingStore`

Create:

```text
src/stores/buskingStore.ts
```

Responsibilities:

- [ ] Master volume.
- [ ] Score guide volume.
- [ ] Loop A/B state.
- [ ] Sync mode: ratio / markers.
- [ ] Selected sync map.
- [ ] Busking panel collapsed state.

Exit criteria:

```text
Busking transport settings are stored outside UI components.
```

---

## Phase 2 — Master Audio Library and Linking

### TODO-020 — GP ↔ Master Audio link metadata

Implement metadata file or local project storage for:

```json
{
  "projectId": "",
  "projectName": "",
  "scoreFileName": "",
  "masterAudioFileName": "",
  "masterAudioUrl": "",
  "durationSeconds": 0,
  "syncMode": "ratio",
  "scoreEndTick": 0,
  "scoreGuideVolume": 0.0,
  "masterVolume": 1.0,
  "updatedAt": ""
}
```

- [ ] Attach selected audio to current GP.
- [ ] Detach audio.
- [ ] Replace audio.
- [ ] Auto-load linked audio when same project opens.

Exit criteria:

```text
The app remembers which master audio belongs to the current GP score.
```

---

### TODO-021 — External Master Audio import

- [ ] Add Import Master Audio button.
- [ ] Accept WAV/MP3/M4A.
- [ ] Copy/register file or use object URL for session.
- [ ] Create metadata.
- [ ] Attach to current project.

Exit criteria:

```text
A user can attach an externally created high-quality audio file to the current GP score.
```

---

### TODO-022 — Audio list grouping

Group Master Audio Library into:

- [ ] Linked to current score.
- [ ] Matching current score by metadata/name.
- [ ] Other generated/imported masters.
- [ ] Legacy/no metadata.

Exit criteria:

```text
User sees the correct audio first and avoids accidental mismatches.
```

---

## Phase 3 — Precision Transport

### TODO-030 — Master Audio clock transport

- [ ] Master audio is the clock.
- [ ] GP score cursor follows audio currentTime.
- [ ] Seek updates both audio and score cursor.
- [ ] Stop resets both.
- [ ] Pause freezes both.

Exit criteria:

```text
Master audio and score visual position behave as one player.
```

---

### TODO-031 — Volume separation

- [ ] Master Audio Volume slider.
- [ ] Score Guide Volume slider.
- [ ] Default master = 100%.
- [ ] Default score guide = 0%.
- [ ] Persist per project.

Exit criteria:

```text
User can hear high-quality master audio while keeping GP player sound muted or low.
```

---

### TODO-032 — Loop A-B

- [ ] Set A at current audio time.
- [ ] Set B at current audio time.
- [ ] Loop toggle.
- [ ] Clear loop.
- [ ] Show loop range.
- [ ] Loop seek keeps score cursor in sync.

Exit criteria:

```text
User can repeat a selected audio/score section reliably.
```

---

### TODO-033 — Bar navigation helpers

- [ ] Previous bar.
- [ ] Next bar.
- [ ] Jump to section.
- [ ] Set loop by current bar or selected section.

Exit criteria:

```text
Practice navigation becomes score-aware, not only time-slider based.
```

---

## Phase 4 — Official Audio Baseline

### TODO-040 — Research alphaTab official Audio Export integration

- [ ] Document exact API usage.
- [ ] Identify required SoundFont loading.
- [ ] Identify WAV encoding path.
- [ ] Identify browser performance constraints.

Exit criteria:

```text
Implementation plan is documented before coding.
```

---

### TODO-041 — Implement Generate Baseline Audio

- [ ] Use alphaTab official export path.
- [ ] Generate baseline WAV that matches score timeline.
- [ ] Register baseline audio in Master Audio Library.
- [ ] Mark source as `alphatab`.

Exit criteria:

```text
User can create score-synchronized baseline audio without using Debug Synth.
```

---

### TODO-042 — MIDI export baseline

- [ ] Use alphaTab official MIDI path if available.
- [ ] Save/register MIDI.
- [ ] Use it later for FluidSynth/VST rendering.

Exit criteria:

```text
There is a reliable MIDI artifact matching the current GP score.
```

---

## Phase 5 — Competitive Benchmark Documentation

### TODO-050 — Create `docs/competitive_benchmark.md`

Sections:

- [ ] Guitar Pro.
- [ ] Soundslice.
- [ ] MuseScore.
- [ ] Flat.io.
- [ ] MaestroAI feature mapping.
- [ ] P0/P1/P2 priority table.
- [ ] Features not to clone.
- [ ] Differentiation strategy.

Exit criteria:

```text
Future feature decisions are grounded in competitive benchmark, not guesswork.
```

---

## Phase 6 — AI Practice Guide

### TODO-060 — Practice Guide shell

- [ ] Create Practice Guide panel.
- [ ] Show current project summary.
- [ ] Show selected/linked master audio.
- [ ] Show placeholder practice sections.

Exit criteria:

```text
Practice Guide screen exists without affecting Busking/Score playback.
```

---

### TODO-061 — Practice section recommendation v1

- [ ] Use score structure and user-selected section data.
- [ ] Recommend 3 practice sections.
- [ ] Create loop buttons for each section.
- [ ] Store user notes.

Exit criteria:

```text
User can jump from practice recommendation to loop playback.
```

---

## Phase 7 — Arrangement Guide

### TODO-070 — Arrangement Guide shell

- [ ] Create Arrangement Guide panel.
- [ ] Show current key/BPM/capo/track info.
- [ ] Show arrangement goals.
- [ ] No destructive score edits yet.

Exit criteria:

```text
Arrangement suggestions can be displayed without editing the score core.
```

---

### TODO-071 — AI arrangement suggestion cards

- [ ] Capo suggestion.
- [ ] Key suggestion.
- [ ] Simplification suggestion.
- [ ] Busking arrangement suggestion.
- [ ] Practice difficulty impact.

Exit criteria:

```text
AI arrangement advice exists as non-destructive suggestions.
```

---

## Phase 8 — Fingering / Technique Guide

### TODO-080 — Fingering Guide shell

- [ ] Create panel.
- [ ] Display selected/current note region.
- [ ] Show placeholder fretboard.

Exit criteria:

```text
Fingering features can be developed independently from score/player core.
```

---

### TODO-081 — Technique Guide shell

- [ ] Detect visible technique markers if available.
- [ ] Show guide cards for bend/slide/hammer-on/pull-off/vibrato/palm mute.
- [ ] Add loop button for related section.

Exit criteria:

```text
Technique guidance starts from score-linked UI, not generic text only.
```

---

## Phase 9 — Audio Quality Expansion

### TODO-090 — FluidSynth renderer plan

- [ ] Document install requirements.
- [ ] Document SoundFont folder layout.
- [ ] Document CLI command.
- [ ] Define renderer interface.

Exit criteria:

```text
FluidSynth can be implemented without touching Busking core.
```

---

### TODO-091 — VST/DAW bridge design

Create:

```text
docs/vst_daw_bridge_design.md
```

- [ ] REAPER CLI feasibility.
- [ ] MIDI stem export strategy.
- [ ] Template/preset strategy.
- [ ] Render output contract.
- [ ] Error logging.

Exit criteria:

```text
VST/DAW quality path is designed as a plugin, not a core rewrite.
```

---

## Current Active Task

```text
TODO-000 — Pull latest and confirm runnable baseline
```

When a task is completed, update this file by changing `[ ]` to `[x]` and move Current Active Task to the next item.
