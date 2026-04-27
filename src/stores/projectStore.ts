import { create } from 'zustand';
import type * as alphaTab from '@coderline/alphatab';
import type { MaestroProject, MaestroTrack } from '../types/project';

const DEFAULT_COLORS = ['#3b82f6', '#22c55e', '#ef4444', '#facc15', '#a855f7', '#ec4899', '#14b8a6', '#6366f1', '#f97316', '#78716c'];

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

  // ★ 새로 추가: TrackInspector용 범용 업데이트
  updateTrack: (index: number, patch: Partial<MaestroTrack>) => void;

  saveToLocal: () => void;
  loadFromLocal: () => boolean;
  markClean: () => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  project: createDefaultProject(),
  isDirty: false,

  updateProject: (patch) => set((s) => ({
    project: { ...s.project, ...patch, updatedAt: new Date().toISOString() },
    isDirty: true,
  })),

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

  syncFromScore: (score) => set((s) => {
    const tracks: MaestroTrack[] = score.tracks.map((t: any, i: number) => ({
      id: `track-${i}`,
      name: t.name || `Track ${i + 1}`,
      instrument: t.playbackInfo?.program?.toString() ?? 'acoustic_guitar',
      color: DEFAULT_COLORS[i % DEFAULT_COLORS.length],
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
        artist: score.artist || s.project.artist || '',
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
      project: { ...s.project, tracks: [...s.project.tracks, newTrack], updatedAt: new Date().toISOString() },
      isDirty: true,
    };
  }),

  removeTrack: (id) => set((s) => ({
    project: { ...s.project, tracks: s.project.tracks.filter(t => t.id !== id), updatedAt: new Date().toISOString() },
    isDirty: true,
  })),

  duplicateTrack: (id) => set((s) => {
    const original = s.project.tracks.find(t => t.id === id);
    if (!original) return {};
    const dup: MaestroTrack = { ...original, id: crypto.randomUUID(), name: `${original.name} (Copy)` };
    const idx = s.project.tracks.findIndex(t => t.id === id);
    const tracks = [...s.project.tracks];
    tracks.splice(idx + 1, 0, dup);
    return { project: { ...s.project, tracks, updatedAt: new Date().toISOString() }, isDirty: true };
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

  // ★ 새로 추가
  updateTrack: (index, patch) => set((s) => {
    const tracks = [...s.project.tracks];
    if (index >= 0 && index < tracks.length) {
      tracks[index] = { ...tracks[index], ...patch };
    }
    return {
      project: { ...s.project, tracks, updatedAt: new Date().toISOString() },
      isDirty: true,
    };
  }),

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
      set({ project: JSON.parse(raw), isDirty: false });
      return true;
    } catch { return false; }
  },

  markClean: () => set({ isDirty: false }),
}));
