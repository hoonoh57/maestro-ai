import { create } from 'zustand';

export type BuskingSyncMode = 'ratio' | 'markers';

export interface LoopRange {
  enabled: boolean;
  startSeconds: number;
  endSeconds: number;
}

interface BuskingState {
  masterVolume: number;
  scoreGuideVolume: number;
  syncMode: BuskingSyncMode;
  loop: LoopRange;
  isRightPanelCollapsed: boolean;

  setMasterVolume: (value: number) => void;
  setScoreGuideVolume: (value: number) => void;
  setSyncMode: (value: BuskingSyncMode) => void;
  setLoopStart: (seconds: number) => void;
  setLoopEnd: (seconds: number) => void;
  setLoopEnabled: (enabled: boolean) => void;
  clearLoop: () => void;
  setRightPanelCollapsed: (collapsed: boolean) => void;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function sanitizeSeconds(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, value);
}

export const useBuskingStore = create<BuskingState>((set) => ({
  masterVolume: 1,
  scoreGuideVolume: 0,
  syncMode: 'ratio',
  loop: {
    enabled: false,
    startSeconds: 0,
    endSeconds: 0,
  },
  isRightPanelCollapsed: false,

  setMasterVolume: (value) => set({ masterVolume: clamp01(value) }),
  setScoreGuideVolume: (value) => set({ scoreGuideVolume: clamp01(value) }),
  setSyncMode: (value) => set({ syncMode: value }),

  setLoopStart: (seconds) => set((state) => {
    const startSeconds = sanitizeSeconds(seconds);
    const endSeconds = state.loop.endSeconds > startSeconds ? state.loop.endSeconds : startSeconds;
    return { loop: { ...state.loop, startSeconds, endSeconds } };
  }),

  setLoopEnd: (seconds) => set((state) => {
    const endSeconds = sanitizeSeconds(seconds);
    const startSeconds = Math.min(state.loop.startSeconds, endSeconds);
    return { loop: { ...state.loop, startSeconds, endSeconds } };
  }),

  setLoopEnabled: (enabled) => set((state) => ({ loop: { ...state.loop, enabled } })),
  clearLoop: () => set({ loop: { enabled: false, startSeconds: 0, endSeconds: 0 } }),
  setRightPanelCollapsed: (collapsed) => set({ isRightPanelCollapsed: collapsed }),
}));
