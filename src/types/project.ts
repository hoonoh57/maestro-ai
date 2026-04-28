export interface MaestroProject {
  id: string;
  name: string;
  artist?: string;
  bpm: number;
  key: string;
  timeSignature: string;
  difficulty?: string;
  tracks: MaestroTrack[];
  instrumentMap: InstrumentMap;
  renderCache: RenderCache;
  createdAt: string;
  updatedAt: string;
}

export type TrackRole = 'melody' | 'guitar' | 'bass' | 'drums' | 'keys' | 'strings' | 'vocal' | 'other';
export type RenderEngineKind = 'preview' | 'soundfont' | 'fluidsynth' | 'musescore' | 'jjazzlab' | 'external' | 'manual_audio';
export type RenderCacheStatus = 'empty' | 'dirty' | 'rendering' | 'ready' | 'error';

export interface RenderProfile {
  id: string;
  name: string;
  engine: RenderEngineKind;
  libraryPath: string;
  presetName: string;
  quality: 'preview' | 'high' | 'performance';
  notes?: string;
}

export interface InstrumentAssignment {
  trackId: string;
  role: TrackRole;
  renderProfileId: string;
  dirty: boolean;
  lastRenderedAt?: string;
}

export interface InstrumentMap {
  profiles: RenderProfile[];
  assignments: InstrumentAssignment[];
  defaultProfileByRole: Record<TrackRole, string>;
}

export interface RenderCacheItem {
  id: string;
  trackId?: string;
  kind: 'track' | 'stem' | 'master';
  status: RenderCacheStatus;
  fileName: string;
  fileUrl: string;
  duration: number;
  updatedAt?: string;
  error?: string;
}

export interface RenderCache {
  masterStatus: RenderCacheStatus;
  items: RenderCacheItem[];
  lastRenderEngine: RenderEngineKind;
  lastRenderedAt?: string;
  message?: string;
}

export interface MaestroTrack {
  id: string;
  name: string;
  instrument: string;
  color: string;
  volume: number;
  pan: number;
  mute: boolean;
  solo: boolean;
  collapsed: boolean;
  atTrackIndex?: number;
  role?: TrackRole;
  isDrum?: boolean;
  normalized?: boolean;
  normalizationNotes?: string[];
  clef?: string;
  capo?: number;
  tuning?: string;
  strings?: number;
}

export type NoteDuration = 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth';
export type InsertTool = 'select' | 'draw' | 'erase' | 'move';

export interface NoteSelection {
  trackIndex: number;
  measureIndex: number;
  beatIndex: number;
  noteIndex: number;
}

export interface NoteData {
  id: string;
  trackIndex: number;
  measure: number;
  beat: number;
  string: number;
  fret: number;
  midiNumber: number;
  duration: number;
  dotted: boolean;
  triplet: boolean;
  dynamic: string;
  velocity: number;
  accidental: string;
  hammerOn: boolean;
  pullOff: boolean;
  slide: boolean;
  bend: boolean;
  vibrato: boolean;
  harmonic: boolean;
  palmMute: boolean;
  letRing: boolean;
  ghost: boolean;
  accent: boolean;
  staccato: boolean;
}
