import type * as alphaTab from '@coderline/alphatab';
import type { MaestroTrack, TrackRole } from '../../types/project';
import { sanitizeArtistName, sanitizeScoreTitle, sanitizeTrackName } from '../text/TextSanitizer';

export interface ImportWarning {
  level: 'info' | 'warning' | 'fixed';
  message: string;
}

export interface NormalizedTrackInfo {
  name: string;
  role: TrackRole;
  instrument: string;
  isDrum: boolean;
  volume: number;
  pan: number;
  notes: string[];
}

export interface ImportNormalizeResult {
  title: string;
  artist: string;
  bpm: number;
  warnings: ImportWarning[];
  tracks: NormalizedTrackInfo[];
}

function clampNumber(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  if (value < min) return min;
  if (value > max) return max;
  return Math.round(value);
}

function lower(value: unknown): string {
  return typeof value === 'string' ? value.toLowerCase() : '';
}

function getProgram(track: any): number {
  const value = track?.playbackInfo?.program;
  return typeof value === 'number' ? value : -1;
}

function getRawVolume(track: any): number {
  const value = track?.playbackInfo?.volume;
  return typeof value === 'number' ? value : 15;
}

function getRawBalance(track: any): number {
  const value = track?.playbackInfo?.balance;
  return typeof value === 'number' ? value : 64;
}

function inferRole(rawName: string, program: number, index: number): TrackRole {
  const name = lower(rawName);
  if (name.includes('drum') || name.includes('perc') || program === 0 && index >= 3) return 'drums';
  if (name.includes('bass') || (program >= 32 && program <= 39)) return 'bass';
  if (name.includes('solo') || name.includes('lead') || name.includes('melody')) return 'melody';
  if (name.includes('guitar') || name.includes('gt') || (program >= 24 && program <= 31)) return 'guitar';
  if (name.includes('piano') || name.includes('key') || (program >= 0 && program <= 7)) return 'keys';
  if (name.includes('string') || name.includes('violin') || name.includes('cello')) return 'strings';
  if (name.includes('vocal') || name.includes('voice')) return 'vocal';
  if (index === 0) return 'guitar';
  return 'other';
}

function inferInstrument(role: TrackRole, program: number): string {
  if (role === 'drums') return 'drums';
  if (role === 'bass') return 'bass';
  if (role === 'melody') return program >= 24 && program <= 31 ? 'electric_guitar' : 'acoustic_guitar';
  if (role === 'guitar') return program >= 27 && program <= 31 ? 'electric_guitar' : 'acoustic_guitar';
  if (role === 'keys') return 'piano';
  if (role === 'strings') return 'violin';
  if (role === 'vocal') return 'vocals';
  return 'other';
}

function roleName(role: TrackRole, index: number): string {
  if (role === 'melody') return 'Melody';
  if (role === 'guitar') return 'Guitar';
  if (role === 'bass') return 'Bass';
  if (role === 'drums') return 'Drums';
  if (role === 'keys') return 'Keys';
  if (role === 'strings') return 'Strings';
  if (role === 'vocal') return 'Vocal';
  return `Track ${index + 1}`;
}

function normalizeVolume(track: any, role: TrackRole, warnings: ImportWarning[], trackName: string): number {
  const raw = getRawVolume(track);
  let percent = Math.round((raw / 16) * 100);
  const min = role === 'drums' ? 78 : role === 'bass' ? 76 : 72;
  if (percent < min) {
    warnings.push({ level: 'fixed', message: `${trackName}: volume raised from ${percent}% to ${min}%.` });
    percent = min;
  }
  if (percent > 100) percent = 100;
  return percent;
}

function normalizePan(track: any): number {
  const raw = getRawBalance(track);
  return clampNumber(((raw - 64) * 100) / 64, -100, 100, 0);
}

export function normalizeImportedScore(score: alphaTab.model.Score, fallbackTitle: string): ImportNormalizeResult {
  const warnings: ImportWarning[] = [];
  const title = sanitizeScoreTitle(score.title, fallbackTitle || 'Untitled Score');
  const artist = sanitizeArtistName(score.artist, '');
  const rawTempo = typeof score.tempo === 'number' ? score.tempo : 120;
  const bpm = clampNumber(rawTempo, 40, 240, 120);

  if (bpm !== rawTempo) {
    warnings.push({ level: 'fixed', message: `Tempo normalized from ${rawTempo} to ${bpm} BPM.` });
  }

  const tracks: NormalizedTrackInfo[] = score.tracks.map((track: any, index: number) => {
    const safeOriginalName = sanitizeTrackName(track?.name, index);
    const program = getProgram(track);
    const role = inferRole(safeOriginalName, program, index);
    const isDrum = role === 'drums';
    const fallbackName = roleName(role, index);
    const safeName = safeOriginalName.startsWith('Track ') ? fallbackName : safeOriginalName;
    const notes: string[] = [];

    if (safeName !== safeOriginalName) notes.push(`Renamed ${safeOriginalName} to ${safeName}.`);
    if (program < 0) notes.push('Missing program info; instrument inferred by role.');
    if (isDrum) notes.push('Detected as percussion/drum track.');

    return {
      name: safeName,
      role,
      instrument: inferInstrument(role, program),
      isDrum,
      volume: normalizeVolume(track, role, warnings, safeName),
      pan: normalizePan(track),
      notes,
    };
  });

  if (tracks.length === 0) {
    warnings.push({ level: 'warning', message: 'No tracks detected in imported score.' });
  }

  return { title, artist, bpm, warnings, tracks };
}

export function applyNormalizedTrackToProjectTrack(track: MaestroTrack, normalized: NormalizedTrackInfo): MaestroTrack {
  return {
    ...track,
    name: normalized.name,
    role: normalized.role,
    instrument: normalized.instrument,
    isDrum: normalized.isDrum,
    volume: normalized.volume,
    pan: normalized.pan,
    normalized: true,
    normalizationNotes: normalized.notes,
  };
}
