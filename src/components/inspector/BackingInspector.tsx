import { useEffect, useMemo, useRef, useState } from 'react';
import { InspectorSection } from '../shared/InspectorSection';
import { Download, FolderOpen, Music, Pause, Play, Repeat, Square, Upload, Volume2 } from 'lucide-react';

type PlayerState = 'empty' | 'loading' | 'ready' | 'playing' | 'paused' | 'stopped' | 'error';

interface PlayerSnapshot {
  state: PlayerState;
  fileName: string;
  duration: number;
  currentTime: number;
  volume: number;
  rate: number;
  loopEnabled: boolean;
  loopStart: number;
  loopEnd: number;
  error: string;
}

const RENDERED_MASTER_CANDIDATES = [
  '/rendered/performance-master.mp3',
  '/rendered/performance-master.wav',
  '/rendered/performance-master.flac',
  '/rendered/performance-master.ogg',
  '/rendered/performance-master.m4a',
];

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const total = Math.floor(seconds);
  const min = Math.floor(total / 60);
  const sec = total % 60;
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function clampRate(value: number): number {
  if (!Number.isFinite(value)) return 1;
  if (value < 0.5) return 0.5;
  if (value > 1.25) return 1.25;
  return Math.round(value * 100) / 100;
}

function isSupportedAudioFile(file: File): boolean {
  const lower = file.name.toLowerCase();
  return lower.endsWith('.mp3') || lower.endsWith('.wav') || lower.endsWith('.ogg') || lower.endsWith('.m4a') || lower.endsWith('.aac') || lower.endsWith('.flac');
}

function fileNameFromUrl(url: string): string {
  const parts = url.split('/');
  return parts[parts.length - 1] || url;
}

export function BackingInspector() {
  const inputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);
  const objectUrlRef = useRef<string>('');
  const timerRef = useRef<number | null>(null);

  const [snapshot, setSnapshot] = useState<PlayerSnapshot>({
    state: 'empty',
    fileName: '',
    duration: 0,
    currentTime: 0,
    volume: 0.92,
    rate: 1,
    loopEnabled: false,
    loopStart: 0,
    loopEnd: 0,
    error: '',
  });

  const progress = useMemo(() => {
    if (snapshot.duration <= 0) return 0;
    return Math.max(0, Math.min(100, (snapshot.currentTime / snapshot.duration) * 100));
  }, [snapshot.currentTime, snapshot.duration]);

  const loopStartPct = useMemo(() => {
    if (snapshot.duration <= 0) return 0;
    return Math.max(0, Math.min(100, (snapshot.loopStart / snapshot.duration) * 100));
  }, [snapshot.loopStart, snapshot.duration]);

  const loopEndPct = useMemo(() => {
    if (snapshot.duration <= 0) return 0;
    return Math.max(0, Math.min(100, (snapshot.loopEnd / snapshot.duration) * 100));
  }, [snapshot.loopEnd, snapshot.duration]);

  const patch = (next: Partial<PlayerSnapshot>) => {
    setSnapshot((prev) => ({ ...prev, ...next }));
  };

  const stopTimer = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = () => {
    stopTimer();
    timerRef.current = window.setInterval(() => {
      const audio = audioRef.current;
      if (!audio) return;
      const current = audio.currentTime || 0;
      const duration = audio.duration || 0;
      setSnapshot((prev) => {
        const end = prev.loopEnd > prev.loopStart ? prev.loopEnd : duration;
        if (prev.loopEnabled && end > prev.loopStart && current >= end) {
          audio.currentTime = prev.loopStart;
          return { ...prev, currentTime: prev.loopStart, duration };
        }
        return { ...prev, currentTime: current, duration };
      });
    }, 60);
  };

  const ensureAudio = () => {
    if (audioRef.current) return audioRef.current;

    const audio = new Audio();
    audio.preload = 'auto';
    audio.preservesPitch = true;
    audio.addEventListener('loadedmetadata', () => patch({ duration: audio.duration || 0, currentTime: 0, loopStart: 0, loopEnd: audio.duration || 0 }));
    audio.addEventListener('canplaythrough', () => patch({ state: 'ready', duration: audio.duration || 0 }));
    audio.addEventListener('play', () => { patch({ state: 'playing' }); startTimer(); });
    audio.addEventListener('pause', () => { if (!audio.ended) patch({ state: 'paused' }); stopTimer(); });
    audio.addEventListener('ended', () => { stopTimer(); audio.currentTime = 0; patch({ state: 'stopped', currentTime: 0 }); });
    audio.addEventListener('error', () => patch({ state: 'error', error: 'Audio file could not be decoded by this browser.' }));
    audioRef.current = audio;
    return audio;
  };

  const ensureGraph = async () => {
    const audio = ensureAudio();
    if (contextRef.current && sourceRef.current && gainRef.current && compressorRef.current) return;

    const factory = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!factory) throw new Error('WebAudio is not available in this browser.');

    const context = new factory({ latencyHint: 'playback' });
    const source = context.createMediaElementSource(audio);
    const gain = context.createGain();
    const compressor = context.createDynamicsCompressor();

    gain.gain.value = snapshot.volume;
    compressor.threshold.value = -18;
    compressor.knee.value = 24;
    compressor.ratio.value = 3;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;

    source.connect(gain);
    gain.connect(compressor);
    compressor.connect(context.destination);

    contextRef.current = context;
    sourceRef.current = source;
    gainRef.current = gain;
    compressorRef.current = compressor;
  };

  const releaseObjectUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = '';
    }
  };

  const loadAudioUrl = async (url: string, fileName?: string) => {
    const audio = ensureAudio();
    audio.pause();
    releaseObjectUrl();
    stopTimer();

    audio.src = `${url}?v=${Date.now()}`;
    audio.volume = snapshot.volume;
    audio.playbackRate = snapshot.rate;
    audio.preservesPitch = true;
    audio.load();

    patch({ state: 'loading', fileName: fileName || fileNameFromUrl(url), currentTime: 0, duration: 0, loopStart: 0, loopEnd: 0, error: '' });

    try {
      await ensureGraph();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to initialize WebAudio graph.';
      patch({ state: 'error', error: message });
    }
  };

  const loadRenderCacheMaster = async () => {
    patch({ state: 'loading', error: 'Searching /public/rendered/performance-master.* ...' });
    for (const url of RENDERED_MASTER_CANDIDATES) {
      try {
        const response = await fetch(`${url}?v=${Date.now()}`, { method: 'HEAD' });
        if (response.ok) {
          await loadAudioUrl(url, fileNameFromUrl(url));
          return;
        }
      } catch {
        // Try next candidate.
      }
    }
    patch({
      state: 'error',
      error: 'No RenderCache master found. Place performance-master.mp3 or performance-master.wav under public/rendered, then click Load RenderCache Master.',
    });
  };

  const openFile = async (file: File) => {
    if (!isSupportedAudioFile(file)) {
      patch({ state: 'error', error: 'Use MP3, WAV, OGG, M4A, AAC, or FLAC for performance playback.' });
      return;
    }

    const audio = ensureAudio();
    audio.pause();
    releaseObjectUrl();
    stopTimer();

    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    audio.src = url;
    audio.volume = snapshot.volume;
    audio.playbackRate = snapshot.rate;
    audio.preservesPitch = true;
    audio.load();

    patch({ state: 'loading', fileName: file.name, currentTime: 0, duration: 0, loopStart: 0, loopEnd: 0, error: '' });

    try {
      await ensureGraph();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to initialize WebAudio graph.';
      patch({ state: 'error', error: message });
    }
  };

  const playPause = async () => {
    const audio = ensureAudio();
    if (!audio.src) return;

    if (snapshot.state === 'playing') {
      audio.pause();
      return;
    }

    try {
      await ensureGraph();
      if (contextRef.current?.state === 'suspended') await contextRef.current.resume();
      await audio.play();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Playback failed.';
      patch({ state: 'error', error: message });
    }
  };

  const stop = () => {
    const audio = ensureAudio();
    audio.pause();
    audio.currentTime = 0;
    stopTimer();
    patch({ state: 'stopped', currentTime: 0 });
  };

  const seekPercent = (percent: number) => {
    const audio = ensureAudio();
    if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
    const next = Math.max(0, Math.min(100, percent));
    audio.currentTime = (next / 100) * audio.duration;
    patch({ currentTime: audio.currentTime });
  };

  const setVolume = (percent: number) => {
    const volume = clamp01(percent / 100);
    const audio = ensureAudio();
    audio.volume = volume;
    if (gainRef.current) gainRef.current.gain.value = volume;
    patch({ volume });
  };

  const setRate = (percent: number) => {
    const rate = clampRate(percent / 100);
    const audio = ensureAudio();
    audio.playbackRate = rate;
    audio.preservesPitch = true;
    patch({ rate });
  };

  const setLoopStartHere = () => {
    const audio = ensureAudio();
    const current = audio.currentTime || 0;
    const end = snapshot.loopEnd > current ? snapshot.loopEnd : snapshot.duration;
    patch({ loopStart: current, loopEnd: end });
  };

  const setLoopEndHere = () => {
    const audio = ensureAudio();
    const current = audio.currentTime || 0;
    const start = snapshot.loopStart < current ? snapshot.loopStart : 0;
    patch({ loopStart: start, loopEnd: current });
  };

  const toggleLoop = () => {
    const duration = snapshot.duration || 0;
    const end = snapshot.loopEnd > snapshot.loopStart ? snapshot.loopEnd : duration;
    patch({ loopEnabled: !snapshot.loopEnabled, loopStart: snapshot.loopStart, loopEnd: end });
  };

  useEffect(() => {
    return () => {
      stopTimer();
      releaseObjectUrl();
      audioRef.current?.pause();
      if (audioRef.current) audioRef.current.src = '';
      contextRef.current?.close();
    };
  }, []);

  return (
    <div>
      <InspectorSection title="Performance Playback" icon={<Music size={12} />}>
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full h-9 rounded bg-blue-600 hover:bg-blue-500 text-white text-[12px] font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Upload size={14} /> Import MP3 / WAV / MR
        </button>
        <button
          onClick={() => void loadRenderCacheMaster()}
          className="mt-2 w-full h-9 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-[12px] font-medium transition-colors flex items-center justify-center gap-2"
        >
          <FolderOpen size={14} /> Load RenderCache Master
        </button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".mp3,.wav,.ogg,.m4a,.aac,.flac,audio/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void openFile(file);
            if (inputRef.current) inputRef.current.value = '';
          }}
        />

        <div className="mt-3 rounded-lg bg-slate-900 border border-slate-700 p-3">
          <div className="text-[11px] text-slate-500 mb-1">Loaded Audio</div>
          <div className="text-xs text-slate-200 truncate">{snapshot.fileName || 'No performance audio loaded'}</div>
          <div className="mt-1 text-[11px] text-slate-500">State: {snapshot.state}</div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => void playPause()}
            disabled={!snapshot.fileName}
            className="h-8 flex-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-100 text-xs flex items-center justify-center gap-1.5"
          >
            {snapshot.state === 'playing' ? <Pause size={13} /> : <Play size={13} />}
            {snapshot.state === 'playing' ? 'Pause' : 'Play'}
          </button>
          <button
            onClick={stop}
            disabled={!snapshot.fileName}
            className="h-8 px-3 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-100 text-xs"
          >
            <Square size={13} />
          </button>
        </div>

        <div className="mt-3">
          <div className="flex justify-between text-[11px] text-slate-500 mb-1">
            <span>{formatTime(snapshot.currentTime)}</span>
            <span>{formatTime(snapshot.duration)}</span>
          </div>
          <input type="range" min={0} max={100} value={progress} onChange={(e) => seekPercent(Number(e.target.value))} className="w-full" />
          <div className="relative h-2">
            <div className="absolute top-0 h-2 w-px bg-emerald-400" style={{ left: `${loopStartPct}%` }} />
            <div className="absolute top-0 h-2 w-px bg-orange-400" style={{ left: `${loopEndPct}%` }} />
          </div>
        </div>

        <div className="mt-3">
          <div className="flex justify-between text-[11px] text-slate-500 mb-1">
            <span className="flex items-center gap-1"><Volume2 size={12} /> Master</span>
            <span>{Math.round(snapshot.volume * 100)}%</span>
          </div>
          <input type="range" min={0} max={100} value={Math.round(snapshot.volume * 100)} onChange={(e) => setVolume(Number(e.target.value))} className="w-full" />
        </div>

        <div className="mt-3">
          <div className="flex justify-between text-[11px] text-slate-500 mb-1">
            <span>Speed / Pitch Preserve</span>
            <span>{Math.round(snapshot.rate * 100)}%</span>
          </div>
          <input type="range" min={50} max={125} step={5} value={Math.round(snapshot.rate * 100)} onChange={(e) => setRate(Number(e.target.value))} className="w-full" />
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <button onClick={setLoopStartHere} disabled={!snapshot.fileName} className="h-8 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-[11px] text-slate-100">Set A</button>
          <button onClick={setLoopEndHere} disabled={!snapshot.fileName} className="h-8 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-[11px] text-slate-100">Set B</button>
          <button onClick={toggleLoop} disabled={!snapshot.fileName} className={`h-8 rounded text-[11px] flex items-center justify-center gap-1 ${snapshot.loopEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-100 disabled:opacity-40'}`}>
            <Repeat size={12} /> Loop
          </button>
        </div>

        <div className="mt-2 text-[11px] text-slate-500">A {formatTime(snapshot.loopStart)} / B {formatTime(snapshot.loopEnd)}</div>

        {snapshot.error && (
          <div className="mt-3 rounded border border-red-500/40 bg-red-950/40 px-2 py-2 text-[11px] text-red-100">{snapshot.error}</div>
        )}
      </InspectorSection>

      <InspectorSection title="RenderCache Folder Rule" icon={<Download size={12} />} defaultOpen={false}>
        <div className="px-3 pb-3 text-[11px] text-slate-400 leading-relaxed">
          Place high-quality output at <span className="text-slate-200">public/rendered/performance-master.mp3</span> or <span className="text-slate-200">performance-master.wav</span>. Then click <span className="text-emerald-300">Load RenderCache Master</span>.
        </div>
      </InspectorSection>
    </div>
  );
}
