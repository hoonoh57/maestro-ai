import * as alphaTab from '@coderline/alphatab';

export type PlayerState = 'stopped' | 'playing' | 'paused';

export interface PositionInfo {
  currentTick: number;
  endTick: number;
  currentTime: number;
  endTime: number;
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

export class AlphaTabEngine {
  private api: alphaTab.AlphaTabApi | null = null;
  private callbacks: EngineCallbacks = {};
  private _isPlayerReady = false;

  get isPlayerReady() { return this._isPlayerReady; }
  get score(): alphaTab.model.Score | null { return this.api?.score ?? null; }
  get tracks(): alphaTab.model.Track[] { return this.api?.tracks ?? []; }
  get alphaTabApi(): alphaTab.AlphaTabApi | null { return this.api; }

  // ── Initialize ──
  init(
    container: HTMLElement,
    viewport: HTMLElement | null,
    callbacks: EngineCallbacks,
  ) {
    if (this.api) {
      console.warn('[AlphaTabEngine] Already initialized');
      return;
    }
    this.callbacks = callbacks;

    const settings: any = {
      core: {
        fontDirectory: '/font/',
        includeNoteBounds: true,
      },
      display: {
        layoutMode: 1, // Page
        staveProfile: 0, // Default
        resources: {
          mainGlyphColor: '#e2e8f0',
          secondaryGlyphColor: '#94a3b8',
          staffLineColor: '#475569',
          barSeparatorColor: '#64748b',
          barNumberColor: '#94a3b8',
          scoreInfoColor: '#cbd5e1',
        },
      },
      player: {
        enablePlayer: true,
        enableCursor: true,
        enableUserInteraction: true,
        enableAnimatedBeatCursor: true,
        enableElementHighlighting: true,
        soundFont: '/soundfont/sonivox.sf2',
        scrollElement: viewport ?? undefined,
        scrollMode: 2, // Continuous
      },
      notation: {
        notationMode: 0, // GuitarPro
      },
    };

    try {
      this.api = new alphaTab.AlphaTabApi(container, settings);
      this.bindEvents();
      console.log('[AlphaTabEngine] Initialized');
    } catch (e) {
      console.error('[AlphaTabEngine] Init failed:', e);
      this.callbacks.onError?.(e as Error);
    }
  }

  private bindEvents() {
    if (!this.api) return;

    this.api.scoreLoaded.on((score: any) => {
      this.callbacks.onScoreLoaded?.(score);
    });

    this.api.renderFinished.on(() => {
      this.callbacks.onRenderFinished?.();
    });

    this.api.playerReady.on(() => {
      this._isPlayerReady = true;
      this.callbacks.onPlayerReady?.();
    });

    this.api.playerStateChanged.on((e: any) => {
      let state: PlayerState = 'stopped';
      if (e.state === alphaTab.synth.PlayerState.Playing) state = 'playing';
      else if (e.state === alphaTab.synth.PlayerState.Paused) state = 'paused';
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

    this.api.beatMouseDown.on((beat: any) => {
      this.callbacks.onBeatMouseDown?.(beat);
    });

    this.api.noteMouseDown.on((note: any) => {
      this.callbacks.onNoteMouseDown?.(note);
    });

    this.api.soundFontLoad.on((e: any) => {
      const pct = e.total > 0 ? Math.round((e.loaded / e.total) * 100) : 0;
      this.callbacks.onSoundFontProgress?.(pct);
    });

    this.api.error.on((e: any) => {
      console.error('[alphaTab error]', e);
      this.callbacks.onError?.(e as Error);
    });
  }

  // ── Score Loading ──
  loadFile(data: ArrayBuffer) { this.api?.load(data); }

  loadTex(tex: string) {
    try { this.api?.tex(tex, 'all'); } catch (e) { console.error('[loadTex]', e); }
  }

  renderTracks(tracks: alphaTab.model.Track[]) { this.api?.renderTracks(tracks); }
  renderScore(score: alphaTab.model.Score) { this.api?.renderScore(score); }
  render() { this.api?.render(); }

  renderAllTracks() {
    const s = this.score;
    if (s && s.tracks.length > 0) this.api?.renderTracks(s.tracks);
  }

  // ── Playback ──
  play() { this.api?.play(); }
  pause() { this.api?.pause(); }
  playPause() { this.api?.playPause(); }
  stop() { this.api?.stop(); }

  setPlaybackSpeed(speed: number) { if (this.api) this.api.playbackSpeed = speed; }
  setMasterVolume(vol: number) { if (this.api) this.api.masterVolume = Math.max(0, Math.min(1, vol)); }
  setMetronomeVolume(vol: number) { if (this.api) this.api.metronomeVolume = Math.max(0, Math.min(1, vol)); }
  setCountInVolume(vol: number) { if (this.api) this.api.countInVolume = Math.max(0, Math.min(1, vol)); }
  setLooping(enabled: boolean) { if (this.api) this.api.isLooping = enabled; }

  // ── Track Controls ──
  changeTrackMute(tracks: alphaTab.model.Track[], mute: boolean) { this.api?.changeTrackMute(tracks, mute); }
  changeTrackSolo(tracks: alphaTab.model.Track[], solo: boolean) { this.api?.changeTrackSolo(tracks, solo); }
  changeTrackVolume(tracks: alphaTab.model.Track[], volume: number) { this.api?.changeTrackVolume(tracks, volume); }

  scrollToCursor() { this.api?.scrollToCursor(); }

  get tickPosition(): number { return this.api?.tickPosition ?? 0; }
  set tickPosition(tick: number) { if (this.api) this.api.tickPosition = tick; }

  downloadMidi() { this.api?.downloadMidi(); }

  playNote(note: alphaTab.model.Note) { try { this.api?.playNote(note); } catch {} }
  playBeat(beat: alphaTab.model.Beat) { try { this.api?.playBeat(beat); } catch {} }

  destroy() {
    try { this.api?.destroy(); } catch {}
    this.api = null;
    this._isPlayerReady = false;
  }
}

export const engine = new AlphaTabEngine();
