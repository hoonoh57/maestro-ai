# MaestroAI TODO

Status: `[ ]` not started, `[~]` in progress, `[x]` done, `[!]` blocked.

## Phase 0 — Stabilize Runtime

### TODO-000 — Pull latest and confirm runnable baseline
- [ ] Run `git pull origin main` locally.
- [ ] Run `npm run stop:dev` locally.
- [ ] Run `npm run dev:all` locally.
- [ ] Confirm web app opens at `http://localhost:5173`.
- [ ] Confirm sound server health is reachable.
- [ ] Confirm no stale 0.2.0 sound server remains.

Exit: app opens, score area renders, no startup crash.

### TODO-001 — Disable direct synthesis as default renderer
- [x] Remove unstable scoreSummary/direct synthesis from the default sound generation path.
- [x] Keep old synthesis only as conceptual debug/fallback path.
- [x] Prevent bad debug synth output from becoming the recommended Busking Master.

Exit: default user flow no longer depends on Python direct synthesis.

### TODO-002 — Restore stable Busking flow
- [~] Busking opens without intentionally covering the score.
- [~] Existing master audio list appears.
- [~] Clicking a master audio file loads it.
- [~] Play/Pause/Stop work.
- [~] Score cursor follows master audio by ratio sync.
- [~] Mismatch warning is visible.

Exit: user can open a GP score, select audio, and play score + audio together.

## Phase 1 — Modular Busking Refactor

### TODO-010 — Split Busking component
- [ ] Create `BuskingMode.tsx`.
- [ ] Create `BuskingTransportBar.tsx`.
- [ ] Create `MasterAudioLibraryPanel.tsx`.
- [ ] Create `SyncStatusPanel.tsx`.
- [ ] Create `StageCuePanel.tsx`.
- [ ] Create `BuskingEmptyState.tsx`.
- [ ] Move UI without changing behavior.
- [ ] Verify compile.

### TODO-011 — Add `audioLibraryStore`
- [x] Create `src/stores/audioLibraryStore.ts`.
- [x] Store generated/imported master audio list.
- [x] Store selected master audio.
- [x] Store current GP-to-audio link.
- [x] Refresh from `/api/sound/jobs`.
- [x] Busking reads list through store.

### TODO-012 — Add `buskingStore`
- [ ] Master volume.
- [ ] Score guide volume.
- [ ] Loop A/B state.
- [ ] Sync mode.
- [ ] Panel collapsed state.

## Phase 2 — Master Audio Library and Linking

### TODO-020 — GP ↔ Master Audio link metadata
- [~] Attach selected audio to current GP.
- [ ] Detach audio.
- [~] Replace audio.
- [~] Auto-load linked audio when same project opens.

### TODO-021 — External Master Audio import
- [ ] Add Import Master Audio button.
- [ ] Accept WAV/MP3/M4A.
- [ ] Register metadata.
- [ ] Attach to current project.

### TODO-022 — Audio list grouping
- [~] Linked to current score.
- [x] Matching current score by metadata/name.
- [x] Other generated/imported masters.
- [x] Legacy/no metadata.

## Phase 3 — Precision Transport

### TODO-030 — Master Audio clock transport
- [~] Master audio as clock.
- [~] Score cursor follows audio time.
- [~] Seek updates both.
- [~] Stop resets both.
- [~] Pause freezes both.

### TODO-031 — Volume separation
- [ ] Master Audio Volume slider.
- [ ] Score Guide Volume slider.
- [ ] Defaults: master 100%, guide 0%.
- [ ] Persist per project.

### TODO-032 — Loop A-B
- [ ] Set A.
- [ ] Set B.
- [ ] Loop toggle.
- [ ] Clear loop.
- [ ] Show loop range.

### TODO-033 — Bar navigation helpers
- [ ] Previous bar.
- [ ] Next bar.
- [ ] Jump to section.
- [ ] Set loop by bar/section.

## Phase 4 — Official Audio Baseline

### TODO-040 — Research alphaTab official Audio Export
- [ ] Document API usage.
- [ ] SoundFont requirements.
- [ ] WAV encoding path.
- [ ] Browser performance constraints.

### TODO-041 — Generate Baseline Audio
- [ ] Use alphaTab official export path.
- [ ] Register baseline audio in Master Audio Library.
- [ ] Mark source as `alphatab`.

### TODO-042 — MIDI export baseline
- [ ] Use alphaTab MIDI path if available.
- [ ] Save/register MIDI.

## Phase 5 — Competitive Benchmark

### TODO-050 — `docs/competitive_benchmark.md`
- [ ] Guitar Pro.
- [ ] Soundslice.
- [ ] MuseScore.
- [ ] Flat.io.
- [ ] MaestroAI mapping.

## Phase 6 — AI Practice Guide

### TODO-060 — Practice Guide shell
- [ ] Create panel.
- [ ] Show project summary.
- [ ] Show linked master audio.
- [ ] Show placeholder practice sections.

### TODO-061 — Practice section recommendation v1
- [ ] Recommend three sections.
- [ ] Add loop buttons.
- [ ] Store notes.

## Phase 7 — Arrangement Guide

### TODO-070 — Arrangement Guide shell
- [ ] Create panel.
- [ ] Show key/BPM/capo/track info.
- [ ] Non-destructive suggestions only.

### TODO-071 — AI suggestion cards
- [ ] Capo.
- [ ] Key.
- [ ] Simplification.
- [ ] Busking arrangement.

## Phase 8 — Fingering / Technique Guide

### TODO-080 — Fingering Guide shell
- [ ] Create panel.
- [ ] Show current note region.
- [ ] Placeholder fretboard.

### TODO-081 — Technique Guide shell
- [ ] Technique cards.
- [ ] Loop button for related section.

## Phase 9 — Audio Quality Expansion

### TODO-090 — FluidSynth renderer plan
- [ ] Install requirements.
- [ ] SoundFont layout.
- [ ] CLI command.
- [ ] Renderer interface.

### TODO-091 — VST/DAW bridge design
- [ ] Create `docs/vst_daw_bridge_design.md`.
- [ ] REAPER CLI feasibility.
- [ ] MIDI stem strategy.
- [ ] Render output contract.

## Current Active Task

```text
TODO-002 — Restore stable Busking flow
```
