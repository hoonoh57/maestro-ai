import { create } from 'zustand';

export type AppMode = 'editor' | 'practice' | 'backing' | 'busking' | 'mixer' | 'test';
export type BottomTab = 'mixer' | 'chords' | 'instrument' | 'practice' | 'setlist' | 'test';

interface UIState {
  mode: AppMode;
  bottomTab: BottomTab;
  bottomPanelOpen: boolean;
  leftSidebarOpen: boolean;
  rightInspectorOpen: boolean;

  setMode: (mode: AppMode) => void;
  setBottomTab: (tab: BottomTab) => void;
  toggleBottomPanel: () => void;
  toggleLeftSidebar: () => void;
  toggleRightInspector: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  mode: 'editor',
  bottomTab: 'mixer',
  bottomPanelOpen: true,
  leftSidebarOpen: true,
  rightInspectorOpen: true,

  setMode: (mode) => set({ mode }),
  setBottomTab: (bottomTab) => set({ bottomTab, bottomPanelOpen: true }),
  toggleBottomPanel: () => set((s) => ({ bottomPanelOpen: !s.bottomPanelOpen })),
  toggleLeftSidebar: () => set((s) => ({ leftSidebarOpen: !s.leftSidebarOpen })),
  toggleRightInspector: () => set((s) => ({ rightInspectorOpen: !s.rightInspectorOpen })),
}));