// ─────────────────────────────────────────────────
// src/components/modes/TestConsole.tsx
// ─────────────────────────────────────────────────

import { undoManager } from '../../core/UndoManager';

import React, { useState, useCallback } from 'react';
import { Play, CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { engine } from '../../core/AlphaTabEngine';
import { useProjectStore } from '../../stores/projectStore';
import { useTransportStore } from '../../stores/transportStore';
import { useFeatureFlagStore } from '../../stores/featureFlagStore';
import { useArrangerStore } from '../../stores/arrangerStore';
import { useSoundEngineStore } from '../../stores/soundEngineStore';

interface TestResult {
  id: string;
  name: string;
  category: string;
  status: 'pass' | 'fail' | 'warn' | 'pending';
  message: string;
  duration: number;
}

function runAllTests(): TestResult[] {
  const results: TestResult[] = [];

  function test(id: string, name: string, category: string, fn: () => string) {
    const t0 = performance.now();
    try {
      const msg = fn();
      results.push({ id, name, category, status: 'pass', message: msg, duration: performance.now() - t0 });
    } catch (e: any) {
      results.push({ id, name, category, status: 'fail', message: e.message || String(e), duration: performance.now() - t0 });
    }
  }

  // ── Score / Model ──

  test('score_loaded', 'Score is loaded', 'Model', () => {
    const score = engine.score;
    if (!score) throw new Error('No score loaded in engine');
    return `Score: "${score.title}" with ${score.tracks.length} track(s)`;
  });

  test('tracks_exist', 'Tracks in project store', 'Model', () => {
    const tracks = useProjectStore.getState().project.tracks;
    if (tracks.length === 0) throw new Error('No tracks in store');
    return `${tracks.length} track(s): ${tracks.map((t) => t.name).join(', ')}`;
  });

  test('tracks_sync', 'Store tracks match score tracks', 'Model', () => {
    const storeTracks = useProjectStore.getState().project.tracks;
    const scoreTracks = engine.score?.tracks ?? [];
    if (storeTracks.length !== scoreTracks.length) {
      throw new Error(`Mismatch: store=${storeTracks.length}, score=${scoreTracks.length}`);
    }
    return `${storeTracks.length} tracks synced`;
  });

  test('render_types_present', 'InstrumentMap and RenderCache exist', 'Model', () => {
    const project = useProjectStore.getState().project;
    if (!project.instrumentMap) throw new Error('Missing instrumentMap');
    if (!project.renderCache) throw new Error('Missing renderCache');
    if (!project.instrumentMap.profiles || project.instrumentMap.profiles.length === 0) throw new Error('Missing render profiles');
    return `${project.instrumentMap.profiles.length} profile(s), render=${project.renderCache.masterStatus}`;
  });

  // ── AI Arranger Workflow ──

  test('arranger_prepare_plan', 'Prepare busking arrangement plan', 'AI Arranger', () => {
    const arranger = useArrangerStore.getState();
    const plan = arranger.preparePlan();
    if (!plan) throw new Error('Plan was not generated');
    if (!plan.title) throw new Error('Plan title missing');
    if (plan.validation.status === 'fail') throw new Error('Plan validation failed');
    return `${plan.title} / ${plan.recommendedKey} / ${plan.performanceBpm} BPM`;
  });

  test('arranger_sections', 'Arrangement sections generated', 'AI Arranger', () => {
    const plan = useArrangerStore.getState().currentPlan;
    if (!plan) throw new Error('No current arrangement plan');
    if (plan.sections.length < 5) throw new Error(`Expected >=5 sections, got ${plan.sections.length}`);
    return plan.sections.map((s) => s.name).join(' → ');
  });

  test('arranger_practice_loops', 'Practice loops generated', 'AI Arranger', () => {
    const plan = useArrangerStore.getState().currentPlan;
    if (!plan) throw new Error('No current arrangement plan');
    if (plan.practiceLoops.length < 3) throw new Error(`Expected >=3 loops, got ${plan.practiceLoops.length}`);
    return `${plan.practiceLoops.length} loops ready`;
  });

  test('arranger_sound_prompt', 'Maestro Sound prompt generated', 'AI Arranger', () => {
    const plan = useArrangerStore.getState().currentPlan;
    if (!plan) throw new Error('No current arrangement plan');
    if (plan.maestroSoundPrompt.length < 120) throw new Error('Prompt too short');
    if (!plan.renderPrompt.includes('Output required')) throw new Error('Render prompt missing output requirements');
    return `${plan.maestroSoundPrompt.length} chars`;
  });

  // ── Maestro Sound Engine ──

  test('sound_engine_store', 'Sound engine store exists', 'Maestro Sound', () => {
    const sound = useSoundEngineStore.getState();
    if (sound.engine !== 'mock') throw new Error(`Expected mock engine, got ${sound.engine}`);
    if (typeof sound.generateMaestroSound !== 'function') throw new Error('generateMaestroSound missing');
    return `engine=${sound.engine}, status=${sound.status}`;
  });

  test('sound_rendercache_contract', 'RenderCache accepts Maestro Sound master', 'Maestro Sound', () => {
    const project = useProjectStore.getState().project;
    if (!project.renderCache) throw new Error('Missing renderCache');
    const status = project.renderCache.masterStatus;
    if (status !== 'dirty' && status !== 'rendering' && status !== 'ready' && status !== 'empty' && status !== 'error') {
      throw new Error(`Unknown RenderCache status: ${status}`);
    }
    return `renderCache=${status}, items=${project.renderCache.items?.length ?? 0}`;
  });

  test('sound_prompt_to_engine_ready', 'Plan can feed sound engine', 'Maestro Sound', () => {
    const plan = useArrangerStore.getState().currentPlan;
    if (!plan) throw new Error('No arrangement plan for sound engine');
    if (!plan.renderPrompt.includes('master.wav')) throw new Error('renderPrompt does not request master.wav');
    if (!plan.maestroSoundPrompt.toLowerCase().includes('performance')) throw new Error('maestroSoundPrompt lacks performance intent');
    return 'Maestro Sound input contract ready';
  });

  // ── Render ──

  test('canvas_rendered', 'Score canvas has content', 'Render', () => {
    const el = document.querySelector('.at-main');
    if (!el) throw new Error('.at-main element not found');
    if (el.children.length === 0) throw new Error('Canvas is empty');
    return `Canvas has ${el.children.length} child element(s)`;
  });

  test('cursor_elements', 'Cursor elements exist', 'Render', () => {
    const bar = document.querySelector('.at-cursor-bar');
    const beat = document.querySelector('.at-cursor-beat');
    if (!bar && !beat) throw new Error('No cursor elements found');
    return `Bar cursor: ${bar ? 'yes' : 'no'}, Beat cursor: ${beat ? 'yes' : 'no'}`;
  });

  // ── Player ──

  test('player_ready', 'Player is ready', 'Playback', () => {
    const ready = useTransportStore.getState().isPlayerReady;
    if (!ready) throw new Error('Player not ready (SoundFont may still be loading)');
    return 'Player ready for playback';
  });

  test('playback_position', 'Position tracking works', 'Playback', () => {
    const pos = useTransportStore.getState().position;
    if (pos.endTime === 0 && pos.endTick === 0) {
      throw new Error('No end position — score may not be loaded');
    }
    return `End: ${pos.endTick} ticks / ${Math.round(pos.endTime)}ms`;
  });

  test('master_volume', 'Master volume in range', 'Playback', () => {
    const vol = useTransportStore.getState().masterVolume;
    if (vol < 0 || vol > 100) throw new Error(`Volume out of range: ${vol}`);
    return `Master volume: ${vol}`;
  });

  // ── Track Controls ──

  test('track_mute_solo', 'Track mute/solo toggleable', 'TrackControls', () => {
    const tracks = useProjectStore.getState().project.tracks;
    if (tracks.length === 0) throw new Error('No tracks to test');
    const t = tracks[0];
    if (typeof t.mute !== 'boolean') throw new Error('mute is not boolean');
    if (typeof t.solo !== 'boolean') throw new Error('solo is not boolean');
    return `Track "${t.name}": mute=${t.mute}, solo=${t.solo}`;
  });

  test('track_volume', 'Track volume in range', 'TrackControls', () => {
    const tracks = useProjectStore.getState().project.tracks;
    for (const t of tracks) {
      if (t.volume < 0 || t.volume > 100) throw new Error(`"${t.name}" volume=${t.volume} out of range`);
    }
    return `All ${tracks.length} track volumes valid`;
  });

  // ── Save / Load ──

  test('save_roundtrip', 'Save/Load roundtrip', 'Persistence', () => {
    const project = useProjectStore.getState().project;
    const json = JSON.stringify(project);
    const parsed = JSON.parse(json);
    if (!parsed.name) throw new Error('Saved JSON missing "name"');
    if (!parsed.tracks || parsed.tracks.length === 0) throw new Error('Saved JSON missing tracks');
    if (!parsed.instrumentMap) throw new Error('Saved JSON missing instrumentMap');
    if (!parsed.renderCache) throw new Error('Saved JSON missing renderCache');
    return `Saved ${json.length} bytes, ${parsed.tracks.length} tracks`;
  });

  test('save_format', 'Saved format is valid JSON', 'Persistence', () => {
    const project = useProjectStore.getState().project;
    const json = JSON.stringify(project);
    const d = JSON.parse(json);
    const requiredKeys = ['name', 'bpm', 'key', 'timeSignature', 'tracks', 'instrumentMap', 'renderCache'];
    for (const k of requiredKeys) {
      if (!(k in d)) throw new Error(`Missing key: ${k}`);
    }
    return 'All required keys present';
  });

  // ── Feature Flags ──

  test('flags_phase12', 'Phase 1+2 flags active', 'FeatureFlags', () => {
    const flags = useFeatureFlagStore.getState().flags;
    const phase12 = flags.filter((f) => f.phase <= 2);
    const active = phase12.filter((f) => f.status === 'active');
    if (active.length !== phase12.length) {
      const inactive = phase12.filter((f) => f.status !== 'active').map((f) => f.id);
      throw new Error(`${active.length}/${phase12.length} active. Inactive: ${inactive.join(', ')}`);
    }
    return `All ${active.length} Phase 1-2 flags are active`;
  });

  test('flags_total', 'Total flag count', 'FeatureFlags', () => {
    const count = useFeatureFlagStore.getState().flags.length;
    if (count === 0) throw new Error('No flags defined');
    return `${count} feature flags defined`;
  });

  // ── Undo / Redo ──
  test('undo_available', 'Undo manager exists', 'Interaction', () => {
    if (typeof undoManager.undo !== 'function') throw new Error('undo is not a function');
    if (typeof undoManager.redo !== 'function') throw new Error('redo is not a function');
    return `UndoManager: canUndo=${undoManager.canUndo}, canRedo=${undoManager.canRedo}`;
  });

  // ── UI / DOM ──

  test('appbar_exists', 'AppBar is rendered', 'UI', () => {
    const el = document.querySelector('header');
    if (!el) throw new Error('No <header> found');
    return 'AppBar header present';
  });

  test('arrange_mode_button', 'Arrange mode button exists', 'UI', () => {
    const text = document.body.innerText;
    if (!text.includes('Arrange')) throw new Error('Arrange button text not found');
    return 'Arrange mode is available in shell';
  });

  return results;
}

// ── Component ──

export function TestConsole() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const handleRunTests = useCallback(() => {
    setIsRunning(true);
    setTimeout(() => {
      const r = runAllTests();
      setResults(r);
      setIsRunning(false);
    }, 100);
  }, []);

  const passed = results.filter((r) => r.status === 'pass').length;
  const failed = results.filter((r) => r.status === 'fail').length;
  const warned = results.filter((r) => r.status === 'warn').length;
  const categories = [...new Set(results.map((r) => r.category))];

  const getStateSnapshot = () => {
    try {
      const proj = useProjectStore.getState().project;
      const transport = useTransportStore.getState();
      const flags = useFeatureFlagStore.getState().flags;
      const arranger = useArrangerStore.getState();
      const sound = useSoundEngineStore.getState();
      return JSON.stringify({
        project: {
          name: proj.name,
          artist: proj.artist ?? '',
          bpm: proj.bpm,
          key: proj.key,
          timeSignature: proj.timeSignature,
          trackCount: proj.tracks?.length ?? 0,
          renderCache: proj.renderCache,
          tracks: (proj.tracks ?? []).map((t) => ({
            name: t.name,
            instrument: t.instrument,
            role: t.role,
            volume: t.volume,
            mute: t.mute,
            solo: t.solo,
          })),
        },
        arranger: {
          goal: arranger.goal,
          hasPlan: !!arranger.currentPlan,
          planTitle: arranger.currentPlan?.title ?? null,
          validation: arranger.currentPlan?.validation.status ?? null,
          loops: arranger.currentPlan?.practiceLoops.length ?? 0,
          sections: arranger.currentPlan?.sections.length ?? 0,
        },
        soundEngine: {
          engine: sound.engine,
          status: sound.status,
          hasResult: !!sound.lastResult,
          fileName: sound.lastResult?.fileName ?? null,
          lastError: sound.lastError,
        },
        transport: {
          playerState: transport.playerState,
          isPlayerReady: transport.isPlayerReady,
          masterVolume: transport.masterVolume,
          playbackSpeed: transport.playbackSpeed,
          position: {
            currentTick: transport.position.currentTick,
            endTick: transport.position.endTick,
            currentTimeMs: Math.round(transport.position.currentTime),
            endTimeMs: Math.round(transport.position.endTime),
          },
        },
        engine: {
          hasScore: !!engine.score,
          scoreTitle: engine.score?.title ?? null,
          scoreTrackCount: engine.score?.tracks?.length ?? 0,
          isPlayerReady: engine.isPlayerReady,
        },
        featureFlags: {
          total: flags.length,
          active: flags.filter((f) => f.status === 'active').length,
          locked: flags.filter((f) => f.status === 'locked').length,
        },
      }, null, 2);
    } catch (e) {
      return `Error reading state: ${e}`;
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0f172a] text-slate-300 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700/60 shrink-0">
        <button
          onClick={handleRunTests}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 rounded text-[12px] font-medium text-white transition-colors"
        >
          {isRunning ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
          Run All Tests
        </button>

        {results.length > 0 && (
          <div className="flex items-center gap-4 text-[12px]">
            <span className="text-green-400">{passed} passed</span>
            {failed > 0 && <span className="text-red-400">{failed} failed</span>}
            {warned > 0 && <span className="text-yellow-400">{warned} warn</span>}
            <span className="text-slate-500">{results.length} total</span>
          </div>
        )}

        {results.length > 0 && failed === 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-green-900/30 border border-green-700/40 rounded text-[11px] text-green-400">
            <CheckCircle2 size={12} /> All tests passed
          </div>
        )}
        {failed > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-red-900/30 border border-red-700/40 rounded text-[11px] text-red-400">
            <XCircle size={12} /> {failed} test(s) failed
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4">
        {results.length === 0 && !isRunning && (
          <div className="text-slate-500 text-sm text-center py-12">
            Click &quot;Run All Tests&quot; to verify editor, arranger, sound engine, practice, busking, and playback workflow.
          </div>
        )}

        {categories.map((cat) => (
          <div key={cat} className="mb-5">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-2">
              {cat}
              <span className="text-[10px] text-slate-600 font-normal normal-case">({results.filter((r) => r.category === cat).length} tests)</span>
            </h3>
            <div className="space-y-1">
              {results.filter((r) => r.category === cat).map((r) => (
                <div
                  key={r.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded text-[12px]
                    ${r.status === 'fail' ? 'bg-red-950/30 border border-red-900/30' : ''}
                    ${r.status === 'pass' ? 'bg-slate-800/40' : ''}
                    ${r.status === 'warn' ? 'bg-yellow-950/20 border border-yellow-900/30' : ''}`}
                >
                  {r.status === 'pass' && <CheckCircle2 size={14} className="text-green-500 shrink-0" />}
                  {r.status === 'fail' && <XCircle size={14} className="text-red-500 shrink-0" />}
                  {r.status === 'warn' && <AlertCircle size={14} className="text-yellow-500 shrink-0" />}
                  {r.status === 'pending' && <RefreshCw size={14} className="text-slate-500 animate-spin shrink-0" />}
                  <span className="font-medium w-48 shrink-0 truncate">{r.name}</span>
                  <span className={`flex-1 truncate ${r.status === 'fail' ? 'text-red-400' : 'text-slate-400'}`} title={r.message}>{r.message}</span>
                  <span className="text-[10px] text-slate-600 tabular-nums shrink-0 w-14 text-right">{r.duration.toFixed(1)}ms</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {results.length > 0 && (
        <div className="h-48 border-t border-slate-700/60 overflow-auto shrink-0">
          <div className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500 sticky top-0 bg-[#0f172a] z-10">State Inspector</div>
          <pre className="px-4 pb-4 text-[10px] text-slate-500 font-mono whitespace-pre-wrap leading-relaxed">{getStateSnapshot()}</pre>
        </div>
      )}
    </div>
  );
}
