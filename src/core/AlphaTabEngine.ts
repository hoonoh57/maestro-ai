import * as alphaTab from '@coderline/alphatab';
import {
  getAlphaTabPlayerSettings,
  getPlaybackQualityProfile,
  normalizeTrackVolume,
  type PlaybackQualityProfile,
} from '../services/playback/PlaybackQualityService';

export type PlayerState = 'stopped' | 'playing' | 'paused';

export interface PositionInfo {
  currentTick: number;
  endTick: number;
  currentTime: number;
  endTime: number;
}

export interface EngineDiagnostics {
  initialized: boolean;
  playerReady: boolean;
  scoreLoadedCount: number;
  renderFinishedCount: number;
  trackCount: number;
  lastContainerWidth: number;
  lastContainerHeight: number;
  lastError: string | null;
  currentPlayerState: PlayerState;
  playbackSpeed: number;
  lastScoreLoadTime: number;
  playbackProfile: string;
  soundFontUrl: string;
  bufferTimeInMilliseconds: number;
}

export interface EngineCallbacks {
  onScoreLoaded?: (score: alphaTab.model.Score) => void;
  onPlayerStateChanged?: (state: PlayerState) => void;
  onPlayerReady?: () => void;
  onPositionChanged?: (pos: PositionInfo) => void;
  onRenderFinished?: () => void;
  onBeatMouseDown?: (beat: alphaTab.model.Beat) => void;
  onNoteMouseDown?: (note: alphaTab.model.Note) => void;
  onSoundFontProgress?: (percent: number) => void;
  onError?: (error: Error) => void;
}

function toError(value: unknown): Error {
  if (value instanceof Error) return value;
  if (typeof value === 'string') return new Error(value);
  try {
    return new Error(JSON.stringify(value));
  } catch {
    return new Error('Unknown alphaTab error');
  }
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

export class AlphaTabEngine {
  private api: alphaTab.AlphaTabApi | null = null;
  private callbacks: EngineCallbacks = {};
  private container: HTMLElement | null = null;
  private viewport: HTMLElement | null = null;
  private _isPlayerReady = false;
  private scoreLoadedCount = 0;
  private renderFinishedCount = 0;
  private lastError: string | null = null;
  private lastContainerWidth = 0;
  private lastContainerHeight = 0;
  private currentPlayerState: PlayerState = 'stopped';
  private lastScoreLoadTime = 0;
  private pendingPlayTimer: number | null = null;
  private playbackProfile: PlaybackQualityProfile = getPlaybackQualityProfile();

  get isInitialized(): boolean { return this.api !== null; }
  get isPlayerReady(): boolean { return this._isPlayerReady; }
  get score(): alphaTab.model.Score | null { return this.api?.score ?? null; }
  get tracks(): alphaTab.model.Track[] { return this.api?.tracks ?? []; }
  get alphaTabApi(): alphaTab.AlphaTabApi | null { return this.api; }

  getDiagnostics(): EngineDiagnostics {
    return {
      initialized: this.api !== null,
      playerReady: this._isPlayerReady,
      scoreLoadedCount: this.scoreLoadedCount,
      renderFinishedCount: this.renderFinishedCount,
      trackCount: this.score?.tracks?.length ?? this.tracks.length ?? 0,
      lastContainerWidth: this.lastContainerWidth,
      lastContainerHeight: this.lastContainerHeight,
      lastError: this.lastError,
      currentPlayerState: this.currentPlayerState,
      playbackSpeed: this.api?.playbackSpeed ?? 1,
      lastScoreLoadTime: this.lastScoreLoadTime,
      playbackProfile: this.playbackProfile.mode,
      soundFontUrl: this.playbackProfile.soundFontUrl,
      bufferTimeInMilliseconds: this.playbackProfile.bufferTimeInMilliseconds,
    };
  }

  init(container: HTMLElement, viewport: HTMLElement | null, callbacks: EngineCallbacks): boolean {
    this.callbacks = callbacks;
    this.playbackProfile = getPlaybackQualityProfile();

    const rect = container.getBoundingClientRect();
    this.lastContainerWidth = Math.round(rect.width);
    this.lastContainerHeight = Math.round(rect.height);

    if (rect.width <= 0 || rect.height <= 0) {
      this.reportError(new Error('[AlphaTabEngine] Container has zero size. Init delayed.'));
      return false;
    }

    if (this.api !== null) {
      if (this.container === container) return true;
      this.destroy();
    }

    this.container = container;
    this.viewport = viewport;
    this._isPlayerReady = false;
    this.scoreLoadedCount = 0;
    this.renderFinishedCount = 0;
    this.lastError = null;
    this.currentPlayerState = 'stopped';
    this.lastScoreLoadTime = 0;

    const playerSettings = getAlphaTabPlayerSettings(this.playbackProfile, alphaTab);

    const settings: any = {
      core: { fontDirectory: '/font/', includeNoteBounds: true },
      display: {
        layoutMode: 1,
        staveProfile: 0,
        resources: {
          mainGlyphColor: '#e2e8f0',
          secondaryGlyphColor: '#94a3b8',
          staffLineColor: '#475569',
          barSeparatorColor: '#64748b',
          barNumberColor: '#94a3b8',
          scoreInfoColor: '#cbd5e1',
        },
      },
      player: { ...playerSettings, scrollElement: viewport ?? undefined },
      notation: { notationMode: 0 },
    };

    try {
      container.innerHTML = '';
      this.api = new alphaTab.AlphaTabApi(container, settings);
      this.normalizePlaybackDefaults();
      this.bindEvents();
      console.info('[AlphaTabEngine] Initialized', this.getDiagnostics());
      return true;
    } catch (e: unknown) {
      this.api = null;
      this.reportError(toError(e));
      return false;
    }
  }

  private bindEvents(): void {
    if (this.api === null) return;
    this.api.scoreLoaded.on((score: alphaTab.model.Score) => {
      this.scoreLoadedCount += 1;
      this.lastScoreLoadTime = Date.now();
      this.normalizeAfterScoreLoad();
      this.normalizeScoreMix(score);
      this.callbacks.onScoreLoaded?.(score);
    });
    this.api.renderFinished.on(() => {
      this.renderFinishedCount += 1;
      this.refreshContainerSize();
      this.callbacks.onRenderFinished?.();
    });
    this.api.playerReady.on(() => {
      this._isPlayerReady = true;
      this.normalizePlaybackDefaults();
      this.callbacks.onPlayerReady?.();
    });
    this.api.playerStateChanged.on((e: any) => {
      let state: PlayerState = 'stopped';
      if (e.state === alphaTab.synth.PlayerState.Playing) state = 'playing';
      else if (e.state === alphaTab.synth.PlayerState.Paused) state = 'paused';
      this.currentPlayerState = state;
      this.callbacks.onPlayerStateChanged?.(state);
    });
    this.api.playerPositionChanged.on((e: any) => {
      this.callbacks.onPositionChanged?.({
        currentTick: e.currentTick ?? 0,
        endTick: e.endTick ?? 0,
        currentTime: e.currentTime ?? 0,
        endTime: e.endTime ?? 0,
      });
    });
    this.api.beatMouseDown.on((beat: alphaTab.model.Beat) => this.callbacks.onBeatMouseDown?.(beat));
    this.api.noteMouseDown.on((note: alphaTab.model.Note) => this.callbacks.onNoteMouseDown?.(note));
    this.api.soundFontLoad.on((e: any) => {
      const pct = e.total > 0 ? Math.round((e.loaded / e.total) * 100) : 0;
      this.callbacks.onSoundFontProgress?.(pct);
    });
    this.api.error.on((e: unknown) => this.reportError(toError(e)));
  }

  private refreshContainerSize(): void {
    if (this.container === null) return;
    const rect = this.container.getBoundingClientRect();
    this.lastContainerWidth = Math.round(rect.width);
    this.lastContainerHeight = Math.round(rect.height);
  }

  private reportError(error: Error): void {
    this.lastError = error.message;
    console.error('[AlphaTabEngine]', error);
    this.callbacks.onError?.(error);
  }

  private normalizePlaybackDefaults(): void {
    if (this.api === null) return;
    this.playbackProfile = getPlaybackQualityProfile();
    this.api.playbackSpeed = 1;
    this.api.masterVolume = this.playbackProfile.masterVolume;
    this.api.metronomeVolume = 0;
    this.api.countInVolume = 0;
    this.api.isLooping = false;
  }

  private normalizeAfterScoreLoad(): void {
    if (this.api === null) return;
    this.clearPendingPlay();
    try { this.api.stop(); } catch {}
    try { this.api.tickPosition = 0; } catch {}
    this.currentPlayerState = 'stopped';
    this._isPlayerReady = false;
    this.normalizePlaybackDefaults();
  }

  private normalizeScoreMix(score: alphaTab.model.Score): void {
    if (this.api === null) return;
    for (let i = 0; i < score.tracks.length; i += 1) {
      const track = score.tracks[i];
      const playbackInfo = (track as any).playbackInfo;
      if (!playbackInfo) continue;
      const currentVolume = typeof playbackInfo.volume === 'number' ? playbackInfo.volume / 16 : this.playbackProfile.minTrackVolume;
      const nextVolume = normalizeTrackVolume(currentVolume, this.playbackProfile);
      playbackInfo.volume = Math.max(1, Math.min(16, Math.round(nextVolume * 16)));
    }
    try { this.api.changeTrackVolume(score.tracks, this.playbackProfile.masterVolume); } catch {}
  }

  private clearPendingPlay(): void {
    if (this.pendingPlayTimer !== null) {
      window.clearTimeout(this.pendingPlayTimer);
      this.pendingPlayTimer = null;
    }
  }

  private getPlaybackStabilizationDelay(): number {
    const trackCount = this.score?.tracks?.length ?? this.tracks.length ?? 1;
    const baseDelay = this.playbackProfile.stabilizationBaseDelay;
    const trackDelay = Math.min(this.playbackProfile.stabilizationMaxTrackDelay, Math.max(0, trackCount - 1) * this.playbackProfile.stabilizationPerTrackDelay);
    return baseDelay + trackDelay;
  }

  loadFile(data: ArrayBuffer): boolean {
    if (this.api === null) {
      this.reportError(new Error('[AlphaTabEngine] Cannot load file before init.'));
      return false;
    }
    try {
      this.normalizeAfterScoreLoad();
      this.api.load(data);
      return true;
    } catch (e: unknown) {
      this.reportError(toError(e));
      return false;
    }
  }

  loadTex(tex: string): boolean {
    if (this.api === null) {
      this.reportError(new Error('[AlphaTabEngine] Cannot load tex before init.'));
      return false;
    }
    try {
      this.normalizeAfterScoreLoad();
      this.api.tex(tex, 'all');
      return true;
    } catch (e: unknown) {
      this.reportError(toError(e));
      return false;
    }
  }

  renderTracks(tracks: alphaTab.model.Track[]): void { this.api?.renderTracks(tracks); }
  renderScore(score: alphaTab.model.Score): void { this.api?.renderScore(score); }
  render(): void { this.api?.render(); }

  renderAllTracks(): void {
    const s = this.score;
    if (s !== null && s.tracks.length > 0) this.api?.renderTracks(s.tracks);
  }

  forceLayoutRefresh(): void {
    if (this.api === null) return;
    if (this.currentPlayerState === 'playing') return;
    this.refreshContainerSize();
    const apiAny = this.api as any;
    if (typeof apiAny.resize === 'function') apiAny.resize();
    this.api.render();
  }

  setTrackInstrument(trackIndex: number, instrument: string): boolean {
    if (this.api === null || this.score === null) return false;
    const track = this.score.tracks[trackIndex];
    if (!track) return false;
    const playbackInfo = (track as any).playbackInfo;
    if (!playbackInfo) return false;

    console.info('[AlphaTabEngine] Instrument metadata changed. Preview engine keeps original loaded GP playback sound.', {
      trackIndex,
      instrument,
      originalProgram: playbackInfo.program,
    });

    return true;
  }

  play(): void { this.safePlay(); }
  pause(): void { this.api?.pause(); }
  playPause(): void { this.safePlayPause(); }
  stop(): void { this.clearPendingPlay(); this.api?.stop(); }

  safePlay(): void {
    if (this.api === null) return;
    this.clearPendingPlay();
    this.normalizePlaybackDefaults();
    const delay = this.getPlaybackStabilizationDelay();
    this.pendingPlayTimer = window.setTimeout(() => {
      this.pendingPlayTimer = null;
      if (this.api === null) return;
      if (!this._isPlayerReady) {
        this.pendingPlayTimer = window.setTimeout(() => this.safePlay(), 240);
        return;
      }
      try { this.api.tickPosition = Math.max(0, this.api.tickPosition); } catch {}
      this.api.play();
    }, delay);
  }

  safePlayPause(): void {
    if (this.api === null) return;
    if (this.currentPlayerState === 'playing') {
      this.clearPendingPlay();
      this.api.pause();
      return;
    }
    this.safePlay();
  }

  setPlaybackSpeed(speed: number): void { if (this.api !== null && Number.isFinite(speed) && speed > 0) this.api.playbackSpeed = speed; }
  setMasterVolume(vol: number): void { if (this.api !== null) this.api.masterVolume = clamp01(vol); }
  setMetronomeVolume(vol: number): void { if (this.api !== null) this.api.metronomeVolume = clamp01(vol); }
  setCountInVolume(vol: number): void { if (this.api !== null) this.api.countInVolume = clamp01(vol); }
  setLooping(enabled: boolean): void { if (this.api !== null) this.api.isLooping = enabled; }

  changeTrackMute(tracks: alphaTab.model.Track[], mute: boolean): void { this.api?.changeTrackMute(tracks, mute); }
  changeTrackSolo(tracks: alphaTab.model.Track[], solo: boolean): void { this.api?.changeTrackSolo(tracks, solo); }
  changeTrackVolume(tracks: alphaTab.model.Track[], volume: number): void { this.api?.changeTrackVolume(tracks, clamp01(volume)); }

  scrollToCursor(): void { this.api?.scrollToCursor(); }

  get tickPosition(): number { return this.api?.tickPosition ?? 0; }
  set tickPosition(tick: number) { if (this.api !== null && Number.isFinite(tick)) this.api.tickPosition = tick; }

  downloadMidi(): void { this.api?.downloadMidi(); }

  playNote(note: alphaTab.model.Note): void {
    try { this.api?.playNote(note); } catch (e: unknown) { this.reportError(toError(e)); }
  }

  playBeat(beat: alphaTab.model.Beat): void {
    try { this.api?.playBeat(beat); } catch (e: unknown) { this.reportError(toError(e)); }
  }

  destroy(): void {
    this.clearPendingPlay();
    try { this.api?.destroy(); } catch (e: unknown) { console.warn('[AlphaTabEngine] destroy warning', e); }
    if (this.container !== null) this.container.innerHTML = '';
    this.api = null;
    this.container = null;
    this.viewport = null;
    this._isPlayerReady = false;
    this.currentPlayerState = 'stopped';
  }
}

export const engine = new AlphaTabEngine();
