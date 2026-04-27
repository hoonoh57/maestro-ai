// ─────────────────────────────────────────────────
// src/core/AlphaTabEngine.ts
// Singleton wrapper around alphaTab API.
// Handles init, rendering, playback, and events.
// ─────────────────────────────────────────────────

import * as alphaTab from '@coderline/alphatab';

export type PlayerState = 'stopped' | 'playing' | 'paused';

export interface PositionInfo {
  currentTick: number;
  endTick: number;
  currentTime: number; // ms
  endTime: number;     // ms
}

export interface EngineCallbacks {
  onScoreLoaded?: (score: alphaTab.model.Score) => void;
  onPlayerStateChanged?: (state: PlayerState) => void;
  onPlayerReady?: () => void;
  onPositionChanged?: (pos: PositionInfo) => void;
  onRenderFinished?: () => void;
  onBeatMouseDown?: (beat: alphaTab.model.Beat) => void;
  onNoteMouseDown?: (note: alphaTab.model.Note) => void;
  onSoundFontLoadProgress?: (loaded: number, total: number) => void;
  onError?: (error: Error) => void;
}

export class AlphaTabEngine {
  private api: alphaTab.AlphaTabApi | null = null;
  private callbacks: EngineCallbacks = {};
  private _isPlayerReady = false;

  get isPlayerReady() {
    return this._isPlayerReady;
  }

  get score(): alphaTab.model.Score | null {
    return this.api?.score ?? null;
  }

  get tracks(): alphaTab.model.Track[] {
    return this.api?.tracks ?? [];
  }

  get alphaTabApi(): alphaTab.AlphaTabApi | null {
    return this.api;
  }

  // ── Initialize ──────────────────────────────
  init(
    container: HTMLElement,
    callbacks: EngineCallbacks,
    options?: Partial<alphaTab.Settings>
  ) {
    // ★ ADDED — 중복 초기화 방어
    if (this.api) {
      console.warn('[AlphaTabEngine] Already initialized, skipping');
      return;
    }

    this.callbacks = callbacks;

    const settings = {
      core: {
        fontDirectory: '/font/',
        includeNoteBounds: true,                    // ★ ADDED — 노트 클릭 감지용
      },
      display: {
        layoutMode: alphaTab.LayoutMode.Page,
        staveProfile: alphaTab.StaveProfile.Default,
        // ★ ADDED — 다크 테마 색상 (alphaTab SVG 렌더링용)
        resources: {
          mainGlyphColor: '#e2e8f0',
          secondaryGlyphColor: '#94a3b8',
          staffLineColor: '#475569',
          barSeparatorColor: '#64748b',
          scoreInfoColor: '#e2e8f0',
          backgroundColor: '#1e293b',
        },
      },
      player: {
        enablePlayer: true,
        enableCursor: true,
        enableUserInteraction: true,
        enableAnimatedBeatCursor: true,              // ★ ADDED
        enableElementHighlighting: true,             // ★ ADDED
        soundFont: '/soundfont/sonivox.sf2',
        scrollMode: alphaTab.ScrollMode.Continuous,
      },
      notation: {
        notationMode: alphaTab.NotationMode.GuitarPro,
      },
      ...(options || {}),
    } as alphaTab.Settings;

    // ★ CHANGED — try-catch로 감싸서 안전하게
    try {
      this.api = new alphaTab.AlphaTabApi(container, settings);
      this.bindEvents();
    } catch (e) {
      console.error('[AlphaTabEngine] Init failed:', e);
      this.callbacks.onError?.(e as Error);
    }
  }

  private bindEvents() {
    if (!this.api) return;

    this.api.scoreLoaded.on((score) => {
      this.callbacks.onScoreLoaded?.(score);
    });

    this.api.renderFinished.on(() => {
      this.callbacks.onRenderFinished?.();
    });

    this.api.playerReady.on(() => {
      this._isPlayerReady = true;
      this.callbacks.onPlayerReady?.();
    });

    this.api.playerStateChanged.on((e) => {
      let state: PlayerState = 'stopped';
      if (e.state === alphaTab.synth.PlayerState.Playing) {
        state = 'playing';
      } else if (e.state === alphaTab.synth.PlayerState.Paused) {
        state = 'paused';
      }
      this.callbacks.onPlayerStateChanged?.(state);
    });

    this.api.playerPositionChanged.on((e) => {
      // ★ CHANGED — NaN 방어
      this.callbacks.onPositionChanged?.({
        currentTick: e.currentTick ?? 0,
        endTick: e.endTick ?? 0,
        currentTime: e.currentTime ?? 0,
        endTime: e.endTime ?? 0,
      });
    });

    this.api.beatMouseDown.on((beat) => {
      this.callbacks.onBeatMouseDown?.(beat);
    });

    this.api.noteMouseDown.on((note) => {
      this.callbacks.onNoteMouseDown?.(note);
    });

    this.api.soundFontLoad.on((e) => {
      this.callbacks.onSoundFontLoadProgress?.(e.loaded, e.total);
    });

    this.api.error.on((e) => {
      this.callbacks.onError?.(e as unknown as Error);
    });
  }

  // ── Score Loading ───────────────────────────
  loadFile(data: ArrayBuffer) {
    this.api?.load(data);
  }

  loadTex(tex: string) {
    // ★ CHANGED — 'all' 파라미터 추가하여 모든 트랙 렌더링
    this.api?.tex(tex, 'all');
  }

  renderTracks(tracks: alphaTab.model.Track[]) {
    this.api?.renderTracks(tracks);
  }

  renderScore(score: alphaTab.model.Score) {
    this.api?.renderScore(score);
  }

  render() {
    this.api?.render();
  }

  // ★ ADDED — 모든 트랙 렌더링 헬퍼
  renderAllTracks() {
    const s = this.score;
    if (s && s.tracks.length > 0) {
      this.api?.renderTracks(s.tracks);
    }
  }

  // ── Playback ────────────────────────────────
  play() {
    this.api?.play();
  }

  pause() {
    this.api?.pause();
  }

  playPause() {
    this.api?.playPause();
  }

  stop() {
    this.api?.stop();
  }

  // ── Playback Settings ──────────────────────
  setPlaybackSpeed(speed: number) {
    if (this.api) {
      this.api.playbackSpeed = speed;
    }
  }

  setMasterVolume(volume: number) {
    if (this.api) {
      this.api.masterVolume = Math.max(0, Math.min(1, volume));
    }
  }

  setMetronomeVolume(volume: number) {
    if (this.api) {
      this.api.metronomeVolume = Math.max(0, Math.min(1, volume));
    }
  }

  setCountInVolume(volume: number) {
    if (this.api) {
      this.api.countInVolume = Math.max(0, Math.min(1, volume));
    }
  }

  setLooping(enabled: boolean) {
    if (this.api) {
      this.api.isLooping = enabled;
    }
  }

  // ── Track Controls ─────────────────────────
  changeTrackMute(tracks: alphaTab.model.Track[], mute: boolean) {
    this.api?.changeTrackMute(tracks, mute);
  }

  changeTrackSolo(tracks: alphaTab.model.Track[], solo: boolean) {
    this.api?.changeTrackSolo(tracks, solo);
  }

  changeTrackVolume(tracks: alphaTab.model.Track[], volume: number) {
    this.api?.changeTrackVolume(tracks, volume);
  }

  // ── Cursor & Navigation ────────────────────
  scrollToCursor() {
    this.api?.scrollToCursor();
  }

  get tickPosition(): number {
    return this.api?.tickPosition ?? 0;
  }

  set tickPosition(tick: number) {
    if (this.api) {
      this.api.tickPosition = tick;
    }
  }

  // ── MIDI Export ─────────────────────────────
  downloadMidi() {
    this.api?.downloadMidi();
  }

  // ── Single note/beat playback ──────────────  ★ ADDED
  playNote(note: alphaTab.model.Note) {
    try { this.api?.playNote(note); } catch {}
  }

  playBeat(beat: alphaTab.model.Beat) {
    try { this.api?.playBeat(beat); } catch {}
  }

  // ── Playback Range (Loop Region) ───────────
  setPlaybackRange(
    start: alphaTab.model.Beat | null,
    end: alphaTab.model.Beat | null
  ) {
    if (this.api && start && end) {
      this.api.playbackRange = { startBeat: start, endBeat: end } as any;
    } else if (this.api) {
      this.api.playbackRange = null;
    }
  }

  // ── Destroy ─────────────────────────────────
  destroy() {
    // ★ CHANGED — try-catch로 안전하게
    try { this.api?.destroy(); } catch {}
    this.api = null;
    this._isPlayerReady = false;
  }
}

// Singleton export
export const engine = new AlphaTabEngine();
