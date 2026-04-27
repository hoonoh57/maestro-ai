import { create } from 'zustand';

export type AppMode = 'editor' | 'practice' | 'backing' | 'busking' | 'mixer' | 'test';

interface UIState {
  mode: AppMode;
  sidebarVisible: boolean;
  inspectorVisible: boolean;
  importCenterVisible: boolean;

  setMode: (mode: AppMode) => void;
  toggleSidebar: () => void;
  toggleInspector: () => void;
  openImportCenter: () => void;
  closeImportCenter: () => void;
  toggleImportCenter: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  mode: 'editor',
  sidebarVisible: true,
  inspectorVisible: true,
  importCenterVisible: false,

  setMode: (mode) => set({ mode }),
  toggleSidebar: () => set((s) => ({ sidebarVisible: !s.sidebarVisible })),
  toggleInspector: () => set((s) => ({ inspectorVisible: !s.inspectorVisible })),
  openImportCenter: () => set({ importCenterVisible: true, mode: 'editor' }),
  closeImportCenter: () => set({ importCenterVisible: false }),
  toggleImportCenter: () => set((s) => ({ importCenterVisible: !s.importCenterVisible, mode: 'editor' })),
}));
