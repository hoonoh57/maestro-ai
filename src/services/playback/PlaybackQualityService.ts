export type PlaybackQualityMode = 'balanced' | 'studio';

export interface PlaybackQualityProfile {
  mode: PlaybackQualityMode;
  soundFontUrl: string;
  bufferTimeInMilliseconds: number;
  masterVolume: number;
  minTrackVolume: number;
  stabilizationBaseDelay: number;
  stabilizationPerTrackDelay: number;
  stabilizationMaxTrackDelay: number;
  forceWebAudioWorklets: boolean;
  disableAnimatedCursorForHeavyScores: boolean;
}

const STORAGE_KEY = 'maestro_playback_quality_profile_v1';

export const DEFAULT_SOUND_FONT_URL = '/soundfont/sonivox.sf2';
export const RECOMMENDED_GM_SOUND_FONT_URL = '/soundfont/FluidR3_GM.sf2';

const BALANCED_PROFILE: PlaybackQualityProfile = {
  mode: 'balanced',
  soundFontUrl: DEFAULT_SOUND_FONT_URL,
  bufferTimeInMilliseconds: 900,
  masterVolume: 0.85,
  minTrackVolume: 0.55,
  stabilizationBaseDelay: 350,
  stabilizationPerTrackDelay: 140,
  stabilizationMaxTrackDelay: 1000,
  forceWebAudioWorklets: true,
  disableAnimatedCursorForHeavyScores: true,
};

const STUDIO_PROFILE: PlaybackQualityProfile = {
  mode: 'studio',
  soundFontUrl: DEFAULT_SOUND_FONT_URL,
  bufferTimeInMilliseconds: 1400,
  masterVolume: 0.92,
  minTrackVolume: 0.72,
  stabilizationBaseDelay: 650,
  stabilizationPerTrackDelay: 220,
  stabilizationMaxTrackDelay: 1800,
  forceWebAudioWorklets: true,
  disableAnimatedCursorForHeavyScores: true,
};

function readJsonProfile(): Partial<PlaybackQualityProfile> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PlaybackQualityProfile>;
    return parsed;
  } catch {
    return null;
  }
}

function mergeProfile(base: PlaybackQualityProfile, patch: Partial<PlaybackQualityProfile> | null): PlaybackQualityProfile {
  if (!patch) return base;
  return {
    ...base,
    ...patch,
    masterVolume: clamp01(patch.masterVolume ?? base.masterVolume),
    minTrackVolume: clamp01(patch.minTrackVolume ?? base.minTrackVolume),
  };
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

export function getPlaybackQualityProfile(): PlaybackQualityProfile {
  const saved = readJsonProfile();
  const mode = saved?.mode ?? 'studio';
  const base = mode === 'balanced' ? BALANCED_PROFILE : STUDIO_PROFILE;
  return mergeProfile(base, saved);
}

export function savePlaybackQualityProfile(profile: Partial<PlaybackQualityProfile>): PlaybackQualityProfile {
  const current = getPlaybackQualityProfile();
  const next = mergeProfile(current, profile);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function getAlphaTabPlayerSettings(profile: PlaybackQualityProfile, alphaTabNamespace: unknown): Record<string, unknown> {
  const ns = alphaTabNamespace as Record<string, unknown>;
  const outputEnum = ns.PlayerOutputMode as Record<string, unknown> | undefined;
  const audioWorkletsValue = outputEnum?.WebAudioAudioWorklets ?? 0;

  return {
    enablePlayer: true,
    enableCursor: true,
    enableUserInteraction: true,
    enableAnimatedBeatCursor: !profile.disableAnimatedCursorForHeavyScores,
    enableElementHighlighting: true,
    soundFont: profile.soundFontUrl,
    outputMode: profile.forceWebAudioWorklets ? audioWorkletsValue : undefined,
    bufferTimeInMilliseconds: profile.bufferTimeInMilliseconds,
    nativeBrowserSmoothScroll: false,
    scrollMode: 2,
    scrollSpeed: 220,
  };
}

export function normalizeTrackVolume(volume: number, profile: PlaybackQualityProfile): number {
  if (!Number.isFinite(volume)) return profile.minTrackVolume;
  if (volume <= 0) return 0;
  if (volume < profile.minTrackVolume) return profile.minTrackVolume;
  if (volume > 1) return 1;
  return volume;
}
