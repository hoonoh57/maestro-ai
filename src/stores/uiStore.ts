import { create } from 'zustand';

export type AppMode = 'editor' | 'practice' | 'backing' | 'busking' | 'mixer' | 'test';

interface UIState {
  mode: AppMode;
  sidebarVisible: boolean;
  inspectorVisible: boolean;

  setMode: (mode: AppMode) => void;
  toggleSidebar: () => void;
  toggleInspector: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  mode: 'editor',
  sidebarVisible: true,
  inspectorVisible: true,

  setMode: (mode) => set({ mode }),
  toggleSidebar: () => set((s) => ({ sidebarVisible: !s.sidebarVisible })),
  toggleInspector: () => set((s) => ({ inspectorVisible: !s.inspectorVisible })),
}));
