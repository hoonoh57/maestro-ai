import { create } from 'zustand';
import { engine as alphaTabEngine } from '../core/AlphaTabEngine';
import { useArrangerStore } from './arrangerStore';
import { useProjectStore } from './projectStore';
import { useTransportStore } from './transportStore';
import { renderMockMaestroSound } from '../services/sound/MockMaestroSoundEngine';
import { checkLocalSoundServer, renderWithLocalSoundServer } from '../services/sound/LocalMaestroSoundEngine';
import type { MaestroSoundEngineKind, MaestroSoundJobStatus, MaestroSoundRenderResult } from '../services/sound/MaestroSoundEngineTypes';
import type { SoundServerHealth } from '../services/sound/SoundServerClient';

interface ScoreSummaryNote {
  trackIndex: number;
  trackName: string;
  role: string;
  startSeconds: number;
  durationSeconds: number;
  midi: number;
  velocity: number;
  string?: number;
  fret?: number;
}

interface ScoreSummaryTrack {
  index: number;
  name: string;
  role: string;
  noteCount: number;
}

interface ScoreSummary {
  title: string;
  artist: string;
  bpm: number;
  durationSeconds: number;
  endTick: number;
  tracks: ScoreSummaryTrack[];
  notes: ScoreSummaryNote[];
}

interface SoundEngineState {
  engine: MaestroSoundEngineKind;
  status: MaestroSoundJobStatus;
  lastResult: MaestroSoundRenderResult | null;
  lastHealth: SoundServerHealth | null;
  lastError: string;
  setEngine: (engine: MaestroSoundEngineKind) => void;
  checkServer: () => Promise<SoundServerHealth>;
  generateMaestroSound: () => Promise<MaestroSoundRenderResult>;
  clearGeneratedSound: () => void;
}

function shouldUseLocalServer(engine: MaestroSoundEngineKind): boolean {
  return engine === 'performance_pack' || engine === 'ace_step' || engine === 'local_ai' || engine === 'external_runtime';
}

function getRenderDurationSeconds(): number {
  const position = useTransportStore.getState().position;
  const endTimeMs = Number(position.endTime || 0);
  if (Number.isFinite(endTimeMs) && endTimeMs > 1000) {
    const seconds = Math.ceil(endTimeMs / 1000) + 2;
    return Math.max(8, Math.min(1800, seconds));
  }
  return 16;
}

function getRoleForTrack(index: number): string {
  const project = useProjectStore.getState().project;
  const track = project.tracks(index);
  if (track?.role) return track.role;
  const raw = `${track?.name || ''} ${track?.instrument || ''}`.toLowerCase();
  if (raw.includes('bass')) return 'bass';
  if (raw.includes('drum') || raw.includes('perc')) return 'drums';
  if (raw.includes('guitar') || raw.includes('tab')) return 'guitar';
  if (raw.includes('piano') || raw.includes('key')) return 'keys';
  if (raw.includes('vocal') || raw.includes('melody')) return 'melody';
  return 'other';
}

function toNumber(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function getBeatStartSeconds(beat: any, fallbackSeconds: number): number {
  const candidates = [
    beat?.playbackStart,
    beat?.playbackStartTime,
    beat?.absolutePlaybackStart,
    beat?.start,
    beat?.absoluteStart,
    beat?.tick,
    beat?.absoluteTick,
  ];
  for (const candidate of candidates) {
    const value = Number(candidate);
    if (!Number.isFinite(value) || value < 0) continue;
    if (value > 10000) return value / 1000;
    if (value > 0) return value / 960;
  }
  return fallbackSeconds;
}

function getBeatDurationSeconds(beat: any, bpm: number): number {
  const candidates = [beat?.playbackDuration, beat?.playbackDurationTime, beat?.duration];
  for (const candidate of candidates) {
    const value = Number(candidate);
    if (!Number.isFinite(value) || value <= 0) continue;
    if (value > 10000) return Math.max(0.05, value / 1000);
    if (value > 0) return Math.max(0.05, (60 / Math.max(40, bpm)) * (value / 960));
  }
  return Math.max(0.08, 60 / Math.max(40, bpm));
}

function noteToMidi(note: any, trackIndex: number): number {
  const direct = [note?.midi, note?.midiNote, note?.realValue, note?.displayValue, note?.value, note?.octave ? undefined : undefined];
  for (const candidate of direct) {
    const value = Number(candidate);
    if (Number.isFinite(value) && value >= 12 && value <= 120) return Math.round(value);
  }

  const stringValue = Number(note?.string ?? note?.stringIndex ?? 0);
  const fretValue = Number(note?.fret ?? 0);
  if (Number.isFinite(stringValue) && Number.isFinite(fretValue) && fretValue >= 0 && stringValue > 0) {
    const guitarOpen = [64, 59, 55, 50, 45, 40, 35];
    const base = guitarOpen[Math.max(0, Math.min(guitarOpen.length - 1, Math.round(stringValue) - 1))];
    return Math.max(24, Math.min(108, base + Math.round(fretValue)));
  }

  return 52 + (trackIndex % 3) * 7;
}

function collectScoreSummary(durationSeconds: number): ScoreSummary {
  const score: any = alphaTabEngine.score;
  const project = useProjectStore.getState().project;
  const position = useTransportStore.getState().position;
  const bpm = Math.max(40, Math.round(toNumber(project.bpm, 120)));
  const beatSeconds = 60 / bpm;
  const notes: ScoreSummaryNote[] = [];
  const tracks: ScoreSummaryTrack[] = [];

  if (!score?.tracks || !Array.isArray(score.tracks)) {
    return {
      title: project.name,
      artist: project.artist || '',
      bpm,
      durationSeconds,
      endTick: position.endTick || 0,
      tracks: [],
      notes: [],
    };
  }

  for (let trackIndex = 0; trackIndex < score.tracks.length; trackIndex += 1) {
    const track: any = score.tracks[trackIndex];
    const trackName = String(track?.name || project.tracks(trackIndex)?.name || `Track ${trackIndex + 1}`);
    const role = getRoleForTrack(trackIndex);
    let fallbackBeatIndex = 0;
    let trackNoteCount = 0;

    const staves = Array.isArray(track?.staves) ? track.staves : [];
    for (const staff of staves) {
      const bars = Array.isArray(staff?.bars) ? staff.bars : [];
      for (const bar of bars) {
        const voices = Array.isArray(bar?.voices) ? bar.voices : [];
        for (const voice of voices) {
          const beats = Array.isArray(voice?.beats) ? voice.beats : [];
          for (const beat of beats) {
            const beatNotes = Array.isArray(beat?.notes) ? beat.notes : [];
            const fallbackStart = fallbackBeatIndex * beatSeconds;
            const startSeconds = getBeatStartSeconds(beat, fallbackStart);
            const duration = Math.min(4, getBeatDurationSeconds(beat, bpm));
            fallbackBeatIndex += 1;
            for (const note of beatNotes) {
              if (note?.isRest) continue;
              const midi = noteToMidi(note, trackIndex);
              notes.push({
                trackIndex,
                trackName,
                role,
                startSeconds: Math.max(0, Math.min(durationSeconds, startSeconds)),
                durationSeconds: Math.max(0.05, Math.min(4, duration)),
                midi,
                velocity: 0.72,
                string: Number.isFinite(Number(note?.string)) ? Number(note.string) : undefined,
                fret: Number.isFinite(Number(note?.fret)) ? Number(note.fret) : undefined,
              });
              trackNoteCount += 1;
              if (notes.length >= 20000) break;
            }
            if (notes.length >= 20000) break;
          }
          if (notes.length >= 20000) break;
        }
        if (notes.length >= 20000) break;
      }
      if (notes.length >= 20000) break;
    }

    tracks.push({ index: trackIndex, name: trackName, role, noteCount: trackNoteCount });
  }

  notes.sort((a, b) => a.startSeconds - b.startSeconds || a.trackIndex - b.trackIndex || a.midi - b.midi);
  return {
    title: project.name,
    artist: project.artist || '',
    bpm,
    durationSeconds,
    endTick: position.endTick || 0,
    tracks,
    notes,
  };
}

export const useSoundEngineStore = create<SoundEngineState>((set, get) => ({
  engine: 'performance_pack',
  status: 'idle',
  lastResult: null,
  lastHealth: null,
  lastError: '',

  setEngine: (engine) => set({ engine }),

  checkServer: async () => {
    try {
      const health = await checkLocalSoundServer();
      set({ lastHealth: health, lastError: '' });
      return health;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Sound server health check failed.';
      set({ lastError: message, lastHealth: null });
      throw e;
    }
  },

  generateMaestroSound: async () => {
    const arranger = useArrangerStore.getState();
    const projectStore = useProjectStore.getState();
    const plan = arranger.currentPlan || arranger.preparePlan();
    const engine = get().engine;
    const durationSeconds = getRenderDurationSeconds();
    const scoreSummary = collectScoreSummary(durationSeconds);
    const renderPlan = { ...plan, scoreSummary };

    set({ status: 'rendering', lastError: '' });
    projectStore.updateProject({
      renderCache: {
        ...projectStore.project.renderCache,
        masterStatus: 'rendering',
        lastRenderEngine: 'external',
        message: `Generating Maestro Sound with ${engine} engine for ${durationSeconds}s / ${scoreSummary.notes.length} note events...`,
      },
    });

    try {
      const request = {
        projectId: projectStore.project.id,
        projectName: projectStore.project.name,
        plan: renderPlan,
        engine,
        sampleRate: 44100,
        durationSeconds,
      };

      const result = shouldUseLocalServer(engine)
        ? await renderWithLocalSoundServer(request)
        : await renderMockMaestroSound(request);

      const nextRenderCache = {
        masterStatus: 'ready' as const,
        lastRenderEngine: 'external' as const,
        lastRenderedAt: result.createdAt,
        message: result.message,
        items: [
          {
            id: result.jobId,
            kind: 'master' as const,
            status: 'ready' as const,
            fileName: result.fileName,
            fileUrl: result.fileUrl,
            duration: result.durationSeconds,
            updatedAt: result.createdAt,
          },
        ],
      };

      useProjectStore.getState().updateProject({ renderCache: nextRenderCache });
      set({ status: 'ready', lastResult: result, lastError: '' });
      return result;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to generate Maestro Sound.';
      useProjectStore.getState().updateProject({
        renderCache: {
          ...useProjectStore.getState().project.renderCache,
          masterStatus: 'error',
          message,
        },
      });
      set({ status: 'error', lastError: message });
      throw e;
    }
  },

  clearGeneratedSound: () => {
    const result = get().lastResult;
    if (result?.fileUrl && result.fileUrl.startsWith('blob:')) URL.revokeObjectURL(result.fileUrl);
    set({ status: 'idle', lastResult: null, lastError: '' });
  },
}));
