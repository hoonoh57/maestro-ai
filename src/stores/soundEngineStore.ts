import { create } from 'zustand';
import { useArrangerStore } from './arrangerStore';
import { useProjectStore } from './projectStore';
import { renderMockMaestroSound } from '../services/sound/MockMaestroSoundEngine';
import { checkLocalSoundServer, renderWithLocalSoundServer } from '../services/sound/LocalMaestroSoundEngine';
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

export const useSoundEngineStore = create<SoundEngineState>((set, get) => ({
  engine: 'mock',
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

    set({ status: 'rendering', lastError: '' });
    projectStore.updateProject({
      renderCache: {
        ...projectStore.project.renderCache,
        masterStatus: 'rendering',
        lastRenderEngine: 'external',
        message: `Generating Maestro Sound with ${engine} engine...`,
      },
    });

    try {
      const request = {
        projectId: projectStore.project.id,
        projectName: projectStore.project.name,
        plan,
        engine,
        sampleRate: 44100,
        durationSeconds: 10,
      };

      const result = engine === 'local_ai' || engine === 'external_runtime'
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
