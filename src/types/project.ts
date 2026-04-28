export interface MaestroProject {
  id: string;
  name: string;
  artist?: string;
  bpm: number;
  key: string;
  timeSignature: string;
  difficulty?: string;
  tracks: MaestroTrack[];
  createdAt: string;
  updatedAt: string;
}

export type TrackRole = 'melody' | 'guitar' | 'bass' | 'drums' | 'keys' | 'strings' | 'vocal' | 'other';

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
