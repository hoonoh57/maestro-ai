import { create } from 'zustand';
import { useArrangerStore } from './arrangerStore';
import { useProjectStore } from './projectStore';
import { renderMockMaestroSound } from '../services/sound/MockMaestroSoundEngine';
import type { MaestroSoundEngineKind, MaestroSoundJobStatus, MaestroSoundRenderResult } from '../services/sound/MaestroSoundEngineTypes';

interface SoundEngineState {
  engine: MaestroSoundEngineKind;
  status: MaestroSoundJobStatus;
  lastResult: MaestroSoundRenderResult | null;
  lastError: string;
  setEngine: (engine: MaestroSoundEngineKind) => void;
  generateMaestroSound: () => Promise<MaestroSoundRenderResult>;
  clearGeneratedSound: () => void;
}

export const useSoundEngineStore = create<SoundEngineState>((set, get) => ({
  engine: 'mock',
  status: 'idle',
  lastResult: null,
  lastError: '',

  setEngine: (engine) => set({ engine }),

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
        lastRenderEngine: engine === 'mock' ? 'external' : 'external',
        message: `Generating Maestro Sound with ${engine} engine...`,
      },
    });

    try {
      const result = await renderMockMaestroSound({
        projectId: projectStore.project.id,
        projectName: projectStore.project.name,
        plan,
        engine,
        sampleRate: 44100,
        durationSeconds: 10,
      });

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
