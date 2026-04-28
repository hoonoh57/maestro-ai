# MaestroAI Product Strategy

## 1. Product Definition

MaestroAI is not a simple GP file viewer and not a self-contained toy audio generator.

MaestroAI is a score-based music practice, arrangement, and busking platform built around three stable pillars:

1. **Score Track**
   - GP score import and display.
   - Standard notation / tablature view.
   - Current bar, beat, and note position.
   - Visual guide for practice and performance.

2. **Master Audio Track**
   - High-quality WAV/MP3/M4A audio used as the actual sound source.
   - Audio may come from alphaTab export, Guitar Pro export, DAW/VST rendering, FluidSynth, AI enhancement, or external user import.
   - The product must not be locked into one low-quality internal renderer.

3. **Precision Sync Player**
   - Master Audio is the main clock.
   - GP player follows the master audio position visually.
   - GP guide sound is optional and defaults to very low volume or mute.
   - Master audio volume and score guide volume are controlled independently.

The core product value is:

```text
High-quality master audio + GP score visual timeline + precise practice/busking control + AI guidance.
```

## 2. Strategic Decision

The previous direct Python synthesis path is not suitable as the main audio engine.

The project will no longer spend core development effort trying to make a hand-written numpy/pluck/drum renderer compete with Guitar Pro, MuseScore, DAW, VST, or professional sample libraries.

Instead:

- The GP player provides the accurate score timeline.
- High-quality audio can be imported, generated, enhanced, or replaced through modular engines.
- The Busking Sync Player keeps the score and master audio aligned.
- MaestroAI's unique value will come from arrangement, practice guidance, fingering/technique guidance, evaluation, and AI assistance.

## 3. Core Product Flow

```text
GP Import
→ Score displayed through alphaTab
→ Master Audio attached or generated
→ Score and Master Audio linked by metadata
→ Busking Sync Player controls play/pause/seek/loop
→ AI Practice / Arrangement / Technique modules add value on top
```

## 4. Stable Core vs Feature Modules

### Stable Core Layer

These parts must remain small, reliable, and minimally modified:

```text
Core Stable Layer
├─ App Shell
├─ GP Loader / alphaTab integration
├─ Score Viewer
├─ Transport Core
├─ Project Store
├─ Master Audio Library Store
└─ Busking Sync Core
```

Core responsibilities:

- Load and display GP score.
- Maintain project metadata.
- Maintain playback state.
- Register and attach master audio.
- Sync master audio and score visual cursor.

Core must not contain:

- AI arrangement logic.
- Renderer-specific logic.
- Practice evaluation logic.
- Fingering algorithm details.
- Experimental audio synthesis logic.

### Feature Modules

New capabilities must be added as modules:

```text
Feature Modules
├─ Audio Import Module
├─ Master Audio Sync Module
├─ Practice Guide Module
├─ Arrangement Module
├─ Fingering Guide Module
├─ Technique Guide Module
└─ Evaluation Module
```

A feature module may read core state and write structured results back through well-defined interfaces, but it must not alter the core player or score loader directly.

### Renderer Plugins

Audio renderers are replaceable plugins:

```text
Render Engines
├─ AlphaTab Official Export Renderer
├─ FluidSynth Renderer
├─ VST/DAW Bridge Renderer
├─ AI Enhancement Renderer
└─ Debug Synth Renderer
```

The former `performance_pack_engine.py` direct synthesis path should be treated only as a debug/fallback renderer, not as the main product audio engine.

## 5. Competitive Benchmark Direction

### Guitar Pro

Guitar Pro is the benchmark for guitar-centric notation editing and playback basics:

- GP import/export.
- Standard notation + tablature.
- Track management.
- Tuning and capo.
- Transposition.
- Chord diagrams.
- Guitar techniques.
- Loop and speed practice.
- Mixer and soundbank playback.

MaestroAI does not need to clone all Guitar Pro features immediately, but it must eventually cover the guitar workflow basics required for real practice and arrangement.

### Soundslice

Soundslice is the closest benchmark for score + real audio/video sync and practice UX:

- Score synchronized to real recordings.
- Click note/bar to seek.
- Looping.
- Slowdown.
- Stems / part control.
- Visual fretboard.
- Practice-oriented score/audio player.

MaestroAI should adopt the score + master audio synchronization philosophy and extend it with AI composition, arrangement, practice guidance, technique guidance, and evaluation.

### MuseScore / Flat.io

MuseScore and Flat.io are benchmarks for broad notation editing, publishing, and web collaboration.

MaestroAI should not attempt to become a full general-purpose notation editor first. It should remain focused on guitar, practice, arrangement, and busking workflows.

## 6. Product Priorities

### P0: Must Work First

```text
- App starts reliably.
- GP file imports correctly.
- Score is visible.
- Basic playback works.
- Busking mode opens without hiding the score.
- Existing or imported master audio can be selected.
- Master audio can play/pause/stop/seek.
- Score cursor follows master audio.
```

### P1: Stable Busking Product

```text
- Master Audio Library.
- GP ↔ Master Audio metadata link.
- Master volume / score guide volume separation.
- Loop A-B.
- Bar-based navigation.
- Persistent sync settings.
```

### P2: AI Practice and Arrangement

```text
- Practice section recommendation.
- Difficulty analysis.
- AI arrangement suggestions.
- Capo/key suggestion.
- Fingering and technique guide.
- Practice plan generation.
```

### P3: Audio Quality Expansion

```text
- AlphaTab official audio export.
- FluidSynth + SoundFont renderer.
- VST/DAW bridge renderer.
- External master audio import.
- Audio comparison lab.
```

## 7. Development Rules

1. **Keep the stable core small.**
2. **Do not put experimental logic into the core.**
3. **Do not break working playback while adding features.**
4. **Add new features as modules.**
5. **Split files before they become monolithic.**
6. **Every renderer must be replaceable.**
7. **Every generated/imported master audio file must have metadata.**
8. **Todo items must be updated as work progresses.**
9. **Completed items must be checked off in `docs/todo.md`.**
10. **If a feature fails, the existing working player must remain usable.**

## 8. Immediate Stabilization Direction

The next work will focus on:

```text
1. Restore the app to a reliable runnable state.
2. Remove direct synthesis as the default path.
3. Split Busking into smaller components.
4. Add Master Audio Library store.
5. Implement reliable GP ↔ audio linking.
6. Implement volume separation and loop A-B.
7. Document and test each stable step before moving forward.
```

This document is the product direction baseline. Detailed execution is tracked in `docs/todo.md`.
