import { create } from 'zustand';
import type * as alphaTab from '@coderline/alphatab';
import type { InstrumentAssignment, InstrumentMap, MaestroProject, MaestroTrack, RenderCache, RenderProfile, TrackRole } from '../types/project';
import { sanitizeArtistName, sanitizeScoreTitle, sanitizeTrackName } from '../services/text/TextSanitizer';
import { applyNormalizedTrackToProjectTrack, normalizeImportedScore } from '../services/import/GpImportNormalizer';

const DEFAULT_COLORS = ['#3b82f6', '#22c55e', '#ef4444', '#facc15', '#a855f7', '#ec4899', '#14b8a6', '#6366f1', '#f97316', '#78716c'];

const ROLE_ORDER: TrackRole[] = ['melody', 'guitar', 'bass', 'drums', 'keys', 'strings', 'vocal', 'other'];

function createDefaultProfiles(): RenderProfile[] {
  return [
    {
      id: 'preview-fluidr3',
      name: 'Preview - FluidR3 GM',
      engine: 'soundfont',
      libraryPath: '/soundfont/FluidR3_GM.sf2',
      presetName: 'GM Auto',
      quality: 'preview',
      notes: 'Fast built-in score preview path.',
    },
    {
      id: 'hq-fluidsynth',
      name: 'High Quality - FluidSynth',
      engine: 'fluidsynth',
      libraryPath: 'E:/2026/maestro-ai-libraries/SoundFonts/FluidR3_GM.sf2',
      presetName: 'GM Auto',
      quality: 'high',
      notes: 'External local render target. Configure path later in Library Manager.',
    },
    {
      id: 'performance-external',
      name: 'Performance - External Renderer',
      engine: 'external',
      libraryPath: 'E:/2026/maestro-ai-libraries/Rendered',
      presetName: 'Rendered Audio / Stems',
      quality: 'performance',
      notes: 'Canonical busking output path using rendered audio cache.',
    },
  ];
}

function createDefaultInstrumentMap(): InstrumentMap {
  const defaultProfileByRole = {} as Record<TrackRole, string>;
  for (let i = 0; i < ROLE_ORDER.length; i += 1) {
    defaultProfileByRole[ROLE_ORDER[i]] = 'preview-fluidr3';
  }
  return {
    profiles: createDefaultProfiles(),
    assignments: [],
    defaultProfileByRole,
  };
}

function createDefaultRenderCache(): RenderCache {
  return {
    masterStatus: 'empty',
    items: [],
    lastRenderEngine: 'preview',
    message: 'No performance render cache yet.',
  };
}

function createAssignment(track: MaestroTrack, existing?: InstrumentAssignment): InstrumentAssignment {
  const role = track.role || 'other';
  return {
    trackId: track.id,
    role,
    renderProfileId: existing?.renderProfileId || 'preview-fluidr3',
    dirty: existing?.dirty ?? true,
    lastRenderedAt: existing?.lastRenderedAt,
  };
}

function normalizeProjectStructure(project: MaestroProject): MaestroProject {
  const instrumentMap = project.instrumentMap || createDefaultInstrumentMap();
  const renderCache = project.renderCache || createDefaultRenderCache();
  const profiles = instrumentMap.profiles && instrumentMap.profiles.length > 0 ? instrumentMap.profiles : createDefaultProfiles();
  const existingAssignments = instrumentMap.assignments || [];
  const assignments = project.tracks.map((track) => {
    const existing = existingAssignments.find((item) => item.trackId === track.id);
    return createAssignment(track, existing);
  });
  const defaults = instrumentMap.defaultProfileByRole || createDefaultInstrumentMap().defaultProfileByRole;

  return {
    ...project,
    name: sanitizeScoreTitle(project.name, 'Untitled Project'),
    artist: sanitizeArtistName(project.artist, ''),
    tracks: project.tracks.map((track, index) => ({ ...track, name: sanitizeTrackName(track.name, index) })),
    instrumentMap: {
      profiles,
      assignments,
      defaultProfileByRole: defaults,
    },
    renderCache,
  };
}

function createDefaultProject(): MaestroProject {
  return {
    id: crypto.randomUUID(),
    name: 'Untitled Project',
    artist: '',
    bpm: 120,
    key: 'C',
    timeSignature: '4/4',
    difficulty: 'intermediate',
    tracks: [],
    instrumentMap: createDefaultInstrumentMap(),
    renderCache: createDefaultRenderCache(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

interface ProjectState {
  project: MaestroProject;
  isDirty: boolean;

  updateProject: (patch: Partial<MaestroProject>) => void;
  setProject: (p: MaestroProject) => void;
  setProjectName: (name: string) => void;
  setBpm: (bpm: number) => void;
  setKey: (key: string) => void;

  syncFromScore: (score: alphaTab.model.Score) => void;

  addTrack: (name: string, instrument: string) => void;
  removeTrack: (id: string) => void;
  duplicateTrack: (id: string) => void;
  setTrackMute: (id: string, mute: boolean) => void;
  setTrackSolo: (id: string, solo: boolean) => void;
  setTrackVolume: (id: string, volume: number) => void;
  setTrackCollapsed: (id: string, collapsed: boolean) => void;

  updateTrack: (index: number, patch: Partial<MaestroTrack>) => void;
  setTrackRenderProfile: (trackId: string, profileId: string) => void;
  markRenderCacheDirty: (message?: string) => void;

  saveToLocal: () => void;
  loadFromLocal: () => boolean;
  markClean: () => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  project: createDefaultProject(),
  isDirty: false,

  updateProject: (patch) => set((s) => ({
    project: normalizeProjectStructure({ ...s.project, ...patch, updatedAt: new Date().toISOString() }),
    isDirty: true,
  })),

  setProject: (p) => set({
    project: normalizeProjectStructure(p),
    isDirty: false,
  }),

  setProjectName: (name) => set((s) => ({
    project: normalizeProjectStructure({ ...s.project, name: sanitizeScoreTitle(name, s.project.name || 'Untitled Project'), updatedAt: new Date().toISOString() }),
    isDirty: true,
  })),

  setBpm: (bpm) => set((s) => ({
    project: { ...s.project, bpm: Math.max(20, Math.min(300, bpm)), updatedAt: new Date().toISOString() },
    isDirty: true,
  })),

  setKey: (key) => set((s) => ({
    project: { ...s.project, key, updatedAt: new Date().toISOString() },
    isDirty: true,
  })),

  syncFromScore: (score) => set((s) => {
    const normalized = normalizeImportedScore(score, s.project.name || 'Untitled Project');

    const tracks: MaestroTrack[] = score.tracks.map((t: any, i: number) => {
      const baseTrack: MaestroTrack = {
        id: `track-${i}`,
        name: sanitizeTrackName(t.name, i),
        instrument: t.playbackInfo?.program?.toString() ?? 'acoustic_guitar',
        color: DEFAULT_COLORS[i % DEFAULT_COLORS.length],
        volume: Math.round(((t.playbackInfo?.volume ?? 15) / 16) * 100),
        pan: ((t.playbackInfo?.balance ?? 64) - 64) * 100 / 64,
        mute: false,
        solo: false,
        collapsed: false,
        atTrackIndex: i,
      };

      const normalizedTrack = normalized.tracks[i];
      if (!normalizedTrack) return baseTrack;
      return applyNormalizedTrackToProjectTrack(baseTrack, normalizedTrack);
    });

    const nextProject = normalizeProjectStructure({
      ...s.project,
      name: normalized.title,
      artist: normalized.artist,
      bpm: normalized.bpm,
      tracks,
      renderCache: {
        ...s.project.renderCache,
        masterStatus: 'dirty',
        message: 'Score changed. Performance render cache needs refresh.',
      },
      updatedAt: new Date().toISOString(),
    });

    return {
      project: nextProject,
      isDirty: true,
    };
  }),

  addTrack: (name, instrument) => set((s) => {
    const newTrack: MaestroTrack = {
      id: crypto.randomUUID(),
      name: sanitizeTrackName(name, s.project.tracks.length),
      instrument,
      color: DEFAULT_COLORS[s.project.tracks.length % DEFAULT_COLORS.length],
      volume: 80,
      pan: 0,
      mute: false,
      solo: false,
      collapsed: false,
    };
    const nextProject = normalizeProjectStructure({
      ...s.project,
      tracks: [...s.project.tracks, newTrack],
      renderCache: { ...s.project.renderCache, masterStatus: 'dirty', message: 'Track added. Render cache needs refresh.' },
      updatedAt: new Date().toISOString(),
    });
    return { project: nextProject, isDirty: true };
  }),

  removeTrack: (id) => set((s) => ({
    project: normalizeProjectStructure({
      ...s.project,
      tracks: s.project.tracks.filter(t => t.id !== id),
      renderCache: { ...s.project.renderCache, masterStatus: 'dirty', message: 'Track removed. Render cache needs refresh.' },
      updatedAt: new Date().toISOString(),
    }),
    isDirty: true,
  })),

  duplicateTrack: (id) => set((s) => {
    const original = s.project.tracks.find(t => t.id === id);
    if (!original) return {};
    const dup: MaestroTrack = { ...original, id: crypto.randomUUID(), name: `${sanitizeTrackName(original.name, 0)} (Copy)` };
    const idx = s.project.tracks.findIndex(t => t.id === id);
    const tracks = [...s.project.tracks];
    tracks.splice(idx + 1, 0, dup);
    return {
      project: normalizeProjectStructure({
        ...s.project,
        tracks,
        renderCache: { ...s.project.renderCache, masterStatus: 'dirty', message: 'Track duplicated. Render cache needs refresh.' },
        updatedAt: new Date().toISOString(),
      }),
      isDirty: true,
    };
  }),

  setTrackMute: (id, mute) => set((s) => ({
    project: { ...s.project, tracks: s.project.tracks.map(t => t.id === id ? { ...t, mute } : t) },
  })),

  setTrackSolo: (id, solo) => set((s) => ({
    project: { ...s.project, tracks: s.project.tracks.map(t => t.id === id ? { ...t, solo } : t) },
  })),

  setTrackVolume: (id, volume) => set((s) => ({
    project: { ...s.project, tracks: s.project.tracks.map(t => t.id === id ? { ...t, volume } : t) },
  })),

  setTrackCollapsed: (id, collapsed) => set((s) => ({
    project: { ...s.project, tracks: s.project.tracks.map(t => t.id === id ? { ...t, collapsed } : t) },
  })),

  updateTrack: (index, patch) => set((s) => {
    const tracks = [...s.project.tracks];
    if (index >= 0 && index < tracks.length) {
      const nextPatch = { ...patch };
      if (typeof nextPatch.name === 'string') nextPatch.name = sanitizeTrackName(nextPatch.name, index);
      tracks[index] = { ...tracks[index], ...nextPatch };
    }
    return {
      project: normalizeProjectStructure({
        ...s.project,
        tracks,
        renderCache: { ...s.project.renderCache, masterStatus: 'dirty', message: 'Track edited. Performance render cache needs refresh.' },
        updatedAt: new Date().toISOString(),
      }),
      isDirty: true,
    };
  }),

  setTrackRenderProfile: (trackId, profileId) => set((s) => ({
    project: normalizeProjectStructure({
      ...s.project,
      instrumentMap: {
        ...s.project.instrumentMap,
        assignments: s.project.instrumentMap.assignments.map((assignment) => assignment.trackId === trackId ? { ...assignment, renderProfileId: profileId, dirty: true } : assignment),
      },
      renderCache: { ...s.project.renderCache, masterStatus: 'dirty', message: 'Instrument renderer changed. Render cache needs refresh.' },
      updatedAt: new Date().toISOString(),
    }),
    isDirty: true,
  })),

  markRenderCacheDirty: (message) => set((s) => ({
    project: {
      ...s.project,
      renderCache: { ...s.project.renderCache, masterStatus: 'dirty', message: message || 'Performance render cache needs refresh.' },
      updatedAt: new Date().toISOString(),
    },
    isDirty: true,
  })),

  saveToLocal: () => {
    const { project } = get();
    localStorage.setItem(`maestro_project_${project.id}`, JSON.stringify(normalizeProjectStructure(project)));
    localStorage.setItem('maestro_last_project_id', project.id);
    set({ isDirty: false });
  },

  loadFromLocal: () => {
    const lastId = localStorage.getItem('maestro_last_project_id');
    if (!lastId) return false;
    const raw = localStorage.getItem(`maestro_project_${lastId}`);
    if (!raw) return false;
    try {
      const parsed = JSON.parse(raw) as MaestroProject;
      set({ project: normalizeProjectStructure(parsed), isDirty: false });
      return true;
    } catch { return false; }
  },

  markClean: () => set({ isDirty: false }),
}));
