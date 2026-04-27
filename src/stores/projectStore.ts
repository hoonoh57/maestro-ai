import { create } from 'zustand';
import type * as alphaTab from '@coderline/alphatab';
import type { MaestroProject, MaestroTrack } from '@/types/project';

const DEFAULT_COLORS = ['#3b82f6', '#22c55e', '#ef4444', '#facc15', '#a855f7', '#ec4899'];

function createDefaultProject(): MaestroProject {
  return {
    id: crypto.randomUUID(),
    name: 'Untitled Project',
    bpm: 120,
    key: 'C',
    timeSignature: { numerator: 4, denominator: 4 },
    tracks: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

interface ProjectState {
  project: MaestroProject;
  isDirty: boolean;

  setProject: (p: MaestroProject) => void;
  setProjectName: (name: string) => void;
  setBpm: (bpm: number) => void;
  setKey: (key: string) => void;

  // Track operations
  syncTracksFromScore: (score: alphaTab.model.Score) => void;
  addTrack: (name: string, instrument: string) => void;
  removeTrack: (id: string) => void;
  duplicateTrack: (id: string) => void;
  setTrackMute: (id: string, mute: boolean) => void;
  setTrackSolo: (id: string, solo: boolean) => void;
  setTrackVolume: (id: string, volume: number) => void;
  setTrackCollapsed: (id: string, collapsed: boolean) => void;

  // Persistence
  saveToLocal: () => void;
  loadFromLocal: () => boolean;
  markClean: () => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  project: createDefaultProject(),
  isDirty: false,

  setProject: (p) => set({ project: p, isDirty: false }),
  
  setProjectName: (name) => set((s) => ({
    project: { ...s.project, name, updatedAt: new Date().toISOString() },
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

  syncTracksFromScore: (score) => set((s) => {
    const TRACK_COLORS = [
      '#3b82f6', '#22c55e', '#ef4444', '#f97316', '#facc15',
      '#a855f7', '#ec4899', '#14b8a6', '#6366f1', '#78716c',
    ];
    const tracks: MaestroTrack[] = score.tracks.map((t, i) => ({
      id: `track-${i}`,
      name: t.name || `Track ${i + 1}`,
      instrument: t.playbackInfo?.program?.toString() ?? 'acoustic_guitar',
      color: TRACK_COLORS[i % TRACK_COLORS.length],
      volume: Math.round(((t.playbackInfo?.volume ?? 15) / 16) * 100),
      pan: ((t.playbackInfo?.balance ?? 64) - 64) * 100 / 64,
      mute: false,
      solo: false,
      collapsed: false,
      atTrackIndex: i,
    }));
    return {
      project: {
        ...s.project,
        name: score.title || s.project.name,
        bpm: score.tempo || s.project.bpm,
        tracks,
        updatedAt: new Date().toISOString(),
      },
      isDirty: true,
    };
  }),

  addTrack: (name, instrument) => set((s) => {
    const newTrack: MaestroTrack = {
      id: crypto.randomUUID(),
      name,
      instrument,
      color: DEFAULT_COLORS[s.project.tracks.length % DEFAULT_COLORS.length],
      volume: 80,
      pan: 0,
      mute: false,
      solo: false,
      collapsed: false,
    };
    return {
      project: {
        ...s.project,
        tracks: [...s.project.tracks, newTrack],
        updatedAt: new Date().toISOString(),
      },
      isDirty: true,
    };
  }),

  removeTrack: (id) => set((s) => ({
    project: {
      ...s.project,
      tracks: s.project.tracks.filter(t => t.id !== id),
      updatedAt: new Date().toISOString(),
    },
    isDirty: true,
  })),

  duplicateTrack: (id) => set((s) => {
    const original = s.project.tracks.find(t => t.id === id);
    if (!original) return {};
    const dup: MaestroTrack = {
      ...original,
      id: crypto.randomUUID(),
      name: `${original.name} (Copy)`,
    };
    const idx = s.project.tracks.findIndex(t => t.id === id);
    const tracks = [...s.project.tracks];
    tracks.splice(idx + 1, 0, dup);
    return {
      project: { ...s.project, tracks, updatedAt: new Date().toISOString() },
      isDirty: true,
    };
  }),

  setTrackMute: (id, mute) => set((s) => ({
    project: {
      ...s.project,
      tracks: s.project.tracks.map(t => t.id === id ? { ...t, mute } : t),
    },
  })),

  setTrackSolo: (id, solo) => set((s) => ({
    project: {
      ...s.project,
      tracks: s.project.tracks.map(t => t.id === id ? { ...t, solo } : t),
    },
  })),

  setTrackVolume: (id, volume) => set((s) => ({
    project: {
      ...s.project,
      tracks: s.project.tracks.map(t => t.id === id ? { ...t, volume } : t),
    },
  })),

  setTrackCollapsed: (id, collapsed) => set((s) => ({
    project: {
      ...s.project,
      tracks: s.project.tracks.map(t => t.id === id ? { ...t, collapsed } : t),
    },
  })),

  saveToLocal: () => {
    const { project } = get();
    localStorage.setItem(`maestro_project_${project.id}`, JSON.stringify(project));
    localStorage.setItem('maestro_last_project_id', project.id);
    set({ isDirty: false });
  },

  loadFromLocal: () => {
    const lastId = localStorage.getItem('maestro_last_project_id');
    if (!lastId) return false;
    const raw = localStorage.getItem(`maestro_project_${lastId}`);
    if (!raw) return false;
    try {
      const project = JSON.parse(raw) as MaestroProject;
      set({ project, isDirty: false });
      return true;
    } catch {
      return false;
    }
  },

  markClean: () => set({ isDirty: false }),
}));