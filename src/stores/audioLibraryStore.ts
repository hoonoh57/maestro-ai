import { create } from 'zustand';
import { getSoundServerUrl } from '../services/sound/LocalMaestroSoundEngine';
import { useProjectStore } from './projectStore';

export type MasterAudioSource = 'external' | 'alphatab' | 'fluidsynth' | 'vst' | 'ai' | 'debug' | 'legacy';
export type MasterAudioSyncMode = 'ratio' | 'markers';

export interface MasterAudioItem {
  id: string;
  fileName: string;
  fileUrl: string;
  metadataFileName?: string | null;
  jobId: string;
  engine: string;
  projectId: string;
  projectName: string;
  sourceTitle: string;
  sourceArtist: string;
  source: MasterAudioSource;
  bpm: number;
  key: string;
  durationSeconds: number;
  sampleRate: number;
  createdAt: string;
  message: string;
  hasMetadata: boolean;
}

export interface MasterAudioLink {
  projectId: string;
  projectName: string;
  scoreFileName: string;
  masterAudioFileName: string;
  masterAudioUrl: string;
  durationSeconds: number;
  syncMode: MasterAudioSyncMode;
  scoreEndTick: number;
  scoreGuideVolume: number;
  masterVolume: number;
  updatedAt: string;
}

interface SoundJobItemPayload {
  fileName: string;
  fileUrl: string;
  metadataFileName?: string | null;
  jobId?: string;
  engine?: string;
  projectId?: string;
  projectName?: string;
  sourceTitle?: string;
  sourceArtist?: string;
  bpm?: number;
  key?: string;
  durationSeconds?: number;
  sampleRate?: number;
  createdAt?: string;
  message?: string;
  hasMetadata?: boolean;
}

interface AudioLibraryState {
  items: MasterAudioItem[];
  selectedItem: MasterAudioItem | null;
  currentLink: MasterAudioLink | null;
  isRefreshing: boolean;
  lastError: string;

  refreshFromServer: () => Promise<void>;
  selectItem: (item: MasterAudioItem | null) => void;
  attachToCurrentProject: (item: MasterAudioItem, scoreEndTick?: number) => MasterAudioLink;
  detachCurrentProject: () => void;
  getMatchingItems: (projectName: string) => MasterAudioItem[];
  getOtherItems: (projectName: string) => MasterAudioItem[];
  loadCurrentProjectLink: () => MasterAudioLink | null;
}

function normalizeForMatch(value: string): string {
  return (value || '')
    .toLowerCase()
    .replace(/\.wav$/i, '')
    .replace(/performance_pack_\d+_\d+_\d+_/i, '')
    .replace(/[^\p{L}\p{N}]+/gu, '');
}

function toSource(engine: string, hasMetadata: boolean): MasterAudioSource {
  const lowered = (engine || '').toLowerCase();
  if (!hasMetadata) return 'legacy';
  if (lowered.includes('alphatab')) return 'alphatab';
  if (lowered.includes('fluidsynth')) return 'fluidsynth';
  if (lowered.includes('vst') || lowered.includes('daw')) return 'vst';
  if (lowered.includes('ai')) return 'ai';
  if (lowered.includes('debug') || lowered.includes('performance_pack')) return 'debug';
  if (lowered.includes('external')) return 'external';
  return 'external';
}

function absoluteOutputUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) return url;
  return `${getSoundServerUrl()}${url.startsWith('/') ? url : `/${url}`}`;
}

function toMasterAudioItem(payload: SoundJobItemPayload): MasterAudioItem {
  const hasMetadata = Boolean(payload.hasMetadata);
  const engine = payload.engine || (hasMetadata ? 'external' : 'legacy');
  return {
    id: payload.jobId || payload.fileName,
    fileName: payload.fileName,
    fileUrl: absoluteOutputUrl(payload.fileUrl || `/outputs/${payload.fileName}`),
    metadataFileName: payload.metadataFileName || null,
    jobId: payload.jobId || payload.fileName,
    engine,
    projectId: payload.projectId || '',
    projectName: payload.projectName || '',
    sourceTitle: payload.sourceTitle || '',
    sourceArtist: payload.sourceArtist || '',
    source: toSource(engine, hasMetadata),
    bpm: Number(payload.bpm || 0),
    key: payload.key || '',
    durationSeconds: Number(payload.durationSeconds || 0),
    sampleRate: Number(payload.sampleRate || 0),
    createdAt: payload.createdAt || '',
    message: payload.message || '',
    hasMetadata,
  };
}

function linkStorageKey(projectId: string): string {
  return `maestro_master_audio_link_${projectId}`;
}

export const useAudioLibraryStore = create<AudioLibraryState>((set, get) => ({
  items: [],
  selectedItem: null,
  currentLink: null,
  isRefreshing: false,
  lastError: '',

  refreshFromServer: async () => {
    set({ isRefreshing: true, lastError: '' });
    try {
      const response = await fetch(`${getSoundServerUrl()}/api/sound/jobs?v=${Date.now()}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json() as { files?: string[]; items?: SoundJobItemPayload[] };
      let items: MasterAudioItem[] = [];
      if (Array.isArray(payload.items) && payload.items.length > 0) {
        items = payload.items.map(toMasterAudioItem);
      } else {
        items = (payload.files || [])
          .filter((name) => name.toLowerCase().endsWith('.wav'))
          .sort()
          .reverse()
          .map((name) => toMasterAudioItem({ fileName: name, fileUrl: `/outputs/${name}`, hasMetadata: false }));
      }
      set({ items, isRefreshing: false, lastError: '' });
      get().loadCurrentProjectLink();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Audio library refresh failed.';
      set({ isRefreshing: false, lastError: message });
    }
  },

  selectItem: (item) => set({ selectedItem: item }),

  attachToCurrentProject: (item, scoreEndTick = 0) => {
    const project = useProjectStore.getState().project;
    const link: MasterAudioLink = {
      projectId: project.id,
      projectName: project.name,
      scoreFileName: project.name,
      masterAudioFileName: item.fileName,
      masterAudioUrl: item.fileUrl,
      durationSeconds: item.durationSeconds,
      syncMode: 'ratio',
      scoreEndTick,
      scoreGuideVolume: 0,
      masterVolume: 1,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(linkStorageKey(project.id), JSON.stringify(link));
    set({ selectedItem: item, currentLink: link });
    return link;
  },

  detachCurrentProject: () => {
    const project = useProjectStore.getState().project;
    localStorage.removeItem(linkStorageKey(project.id));
    set({ currentLink: null });
  },

  getMatchingItems: (projectName) => {
    const key = normalizeForMatch(projectName);
    if (!key) return [];
    return get().items.filter((item) => {
      const itemKey = normalizeForMatch(item.projectName || item.sourceTitle || item.fileName);
      const fileKey = normalizeForMatch(item.fileName);
      return itemKey.includes(key) || key.includes(itemKey) || fileKey.includes(key);
    });
  },

  getOtherItems: (projectName) => {
    const matching = new Set(get().getMatchingItems(projectName).map((item) => item.fileName));
    return get().items.filter((item) => !matching.has(item.fileName));
  },

  loadCurrentProjectLink: () => {
    const project = useProjectStore.getState().project;
    const raw = localStorage.getItem(linkStorageKey(project.id));
    if (!raw) {
      set({ currentLink: null });
      return null;
    }
    try {
      const link = JSON.parse(raw) as MasterAudioLink;
      const selected = get().items.find((item) => item.fileName === link.masterAudioFileName) || null;
      set({ currentLink: link, selectedItem: selected });
      return link;
    } catch {
      localStorage.removeItem(linkStorageKey(project.id));
      set({ currentLink: null });
      return null;
    }
  },
}));
