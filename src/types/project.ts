export interface MaestroProject {
  id: string;
  name: string;
  bpm: number;
  key: string;
  timeSignature: { numerator: number; denominator: number };
  tracks: MaestroTrack[];
  createdAt: string;
  updatedAt: string;
}

export interface MaestroTrack {
  id: string;
  name: string;
  instrument: string;
  color: string;
  volume: number;    // 0–100
  pan: number;       // -100 to +100
  mute: boolean;
  solo: boolean;
  collapsed: boolean;
  atTrackIndex?: number;  // alphaTab score track index
}

export type NoteDuration = 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth';
export type InsertTool = 'select' | 'draw' | 'erase' | 'move';

export interface NoteSelection {
  trackIndex: number;
  measureIndex: number;
  beatIndex: number;
  noteIndex: number;
}

export interface PositionInfo {
  measure: number;
  beat: number;
  tick: number;
  timeMs: number;
  totalTimeMs: number;
}