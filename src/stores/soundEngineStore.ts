import { create } from 'zustand';
import { useProjectStore } from './projectStore';
import { checkLocalSoundServer } from '../services/sound/LocalMaestroSoundEngine';
import type { MaestroSoundEngineKind, MaestroSoundJobStatus, MaestroSoundRenderResult } from '../services/sound/MaestroSoundEngineTypes';
import type { SoundServerHealth } from '../services/sound/SoundServerClient';

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

function createDisabledRendererMessage(): string {
  return [
    'Debug synthesis renderer is disabled as a default product path.',
    'Use Busking > Master Audio Library to attach an existing high-quality WAV/MP3,',
    'or use the future AlphaTab Official Export / FluidSynth / VST renderer modules.',
  ].join(' ');
}

export const useSoundEngineStore = create<SoundEngineState>((set) => ({
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
    const projectStore = useProjectStore.getState();
    const message = createDisabledRendererMessage();

    projectStore.updateProject({
      renderCache: {
        ...projectStore.project.renderCache,
        masterStatus: 'empty',
        lastRenderEngine: 'external',
        message,
      },
    });

    set({ status: 'idle', lastError: message });
    throw new Error(message);
  },

  clearGeneratedSound: () => {
    set({ status: 'idle', lastResult: null, lastError: '' });
  },
}));
