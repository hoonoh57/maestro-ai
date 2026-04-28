import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Mic2, MonitorPlay, Music, Pause, Play, RefreshCw, Route, Square, Sparkles } from 'lucide-react';
import { engine } from '../../core/AlphaTabEngine';
import { getSoundServerUrl } from '../../services/sound/LocalMaestroSoundEngine';
import { useArrangerStore } from '../../stores/arrangerStore';
import { useProjectStore } from '../../stores/projectStore';
import { useTransportStore } from '../../stores/transportStore';
import { useUIStore } from '../../stores/uiStore';

function formatGoalLabel(value: string): string {
  return value.replace(/_/g, ' ');
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const total = Math.floor(seconds);
  const min = Math.floor(total / 60);
  const sec = total % 60;
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function generatedFileUrl(fileName: string): string {
  return `${getSoundServerUrl()}/outputs/${encodeURIComponent(fileName)}`;
}

function normalizeForMatch(value: string): string {
  return (value || '')
    .toLowerCase()
    .replace(/\.wav$/i, '')
    .replace(/performance_pack_\d+_\d+_\d+_/i, '')
    .replace(/[^\p{L}\p{N}]+/gu, '');
}

interface SoundJobItem {
  fileName: string;
  fileUrl: string;
  metadataFileName?: string | null;
  jobId: string;
  engine: string;
  projectId: string;
  projectName: string;
  sourceTitle: string;
  sourceArtist: string;
  bpm: number;
  key: string;
  durationSeconds: number;
  sampleRate: number;
  createdAt: string;
  message: string;
  hasMetadata: boolean;
}

type BuskingPlayerState = 'empty' | 'loading' | 'ready' | 'playing' | 'paused' | 'stopped' | 'error';

export function BuskingWorkflowPanel() {
  const currentPlan = useArrangerStore((s) => s.currentPlan);
  const preparePlan = useArrangerStore((s) => s.preparePlan);
  const project = useProjectStore((s) => s.project);
  const setMode = useUIStore((s) => s.setMode);
  const transportPosition = useTransportStore((s) => s.position);
  const setTransportPosition = useTransportStore((s) => s.setPosition);
  const setPlayerState = useTransportStore((s) => s.setPlayerState);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string>('');
  const timerRef = useRef<number | null>(null);
  const [state, setState] = useState<BuskingPlayerState>('empty');
  const [fileName, setFileName] = useState('');
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState('');
  const [generatedJobs, setGeneratedJobs] = useState<SoundJobItem[]>([]);
  const [isRefreshingFiles, setIsRefreshingFiles] = useState(false);

  const masterItem = useMemo(() => {
    return project.renderCache?.items?.find((item) => item.kind === 'master' && item.status === 'ready' && item.fileUrl) || null;
  }, [project.renderCache]);

  const scoreMatchKey = useMemo(() => normalizeForMatch(project.name || currentPlan?.title || ''), [project.name, currentPlan?.title]);

  const matchedJobs = useMemo(() => {
    if (!scoreMatchKey) return [];
    return generatedJobs.filter((job) => {
      const titleKey = normalizeForMatch(job.projectName || job.sourceTitle || job.fileName);
      const fileKey = normalizeForMatch(job.fileName);
      return titleKey.includes(scoreMatchKey) || scoreMatchKey.includes(titleKey) || fileKey.includes(scoreMatchKey);
    });
  }, [generatedJobs, scoreMatchKey]);

  const otherJobs = useMemo(() => {
    const matched = new Set(matchedJobs.map((job) => job.fileName));
    return generatedJobs.filter((job) => !matched.has(job.fileName));
  }, [generatedJobs, matchedJobs]);

  const progress = duration > 0 ? Math.max(0, Math.min(100, (currentTime / duration) * 100)) : 0;

  const selectedJob = useMemo(() => generatedJobs.find((job) => job.fileName === fileName) || null, [generatedJobs, fileName]);

  const mismatchWarning = useMemo(() => {
    if (!fileName) return '';
    if (selectedJob?.hasMetadata) {
      const jobKey = normalizeForMatch(selectedJob.projectName || selectedJob.sourceTitle || selectedJob.fileName);
      if (scoreMatchKey && jobKey && (jobKey.includes(scoreMatchKey) || scoreMatchKey.includes(jobKey))) return '';
      return `Audio/Score mismatch: loaded score is "${project.name}", but selected audio belongs to "${selectedJob.projectName || selectedJob.sourceTitle || selectedJob.fileName}".`;
    }
    const audioName = normalizeForMatch(fileName);
    if (!scoreMatchKey || !audioName) return '';
    if (audioName.includes(scoreMatchKey) || scoreMatchKey.includes(audioName)) return '';
    return `Audio/Score mismatch: loaded score is "${project.name}", but selected audio is "${fileName}". Load the matching GP score for accurate busking sync.`;
  }, [fileName, project.name, scoreMatchKey, selectedJob]);

  const stopSyncTimer = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const releaseObjectUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = '';
    }
  };

  const syncScoreToAudio = () => {
    const player = audioRef.current;
    if (!player) return;
    const nextDuration = Number.isFinite(player.duration) && player.duration > 0 ? player.duration : duration;
    const nextCurrent = Number.isFinite(player.currentTime) ? player.currentTime : 0;
    const endTick = transportPosition.endTick;
    let targetTick = 0;
    if (nextDuration > 0 && endTick > 0) {
      targetTick = Math.max(0, Math.min(endTick, Math.round((nextCurrent / nextDuration) * endTick)));
      try { engine.tickPosition = targetTick; } catch {}
      try { engine.scrollToCursor(); } catch {}
    }
    setCurrentTime(nextCurrent);
    setDuration(nextDuration);
    setTransportPosition({ currentTick: targetTick, endTick, currentTime: nextCurrent * 1000, endTime: nextDuration * 1000 });
  };

  const startSyncTimer = () => {
    stopSyncTimer();
    timerRef.current = window.setInterval(syncScoreToAudio, 120);
  };

  const ensureAudio = () => {
    if (audioRef.current) return audioRef.current;
    const player = new Audio();
    player.preload = 'auto';
    player.preservesPitch = true;
    player.addEventListener('loadedmetadata', () => {
      const d = Number.isFinite(player.duration) ? player.duration : 0;
      setDuration(d);
      setCurrentTime(0);
      setState('ready');
      setError('');
      setTransportPosition({ currentTick: 0, endTick: transportPosition.endTick, currentTime: 0, endTime: d * 1000 });
    });
    player.addEventListener('canplaythrough', () => { setState('ready'); setError(''); });
    player.addEventListener('play', () => { setState('playing'); setPlayerState('playing'); startSyncTimer(); });
    player.addEventListener('pause', () => { if (!player.ended) { setState('paused'); setPlayerState('paused'); } stopSyncTimer(); });
    player.addEventListener('ended', () => {
      stopSyncTimer();
      player.currentTime = 0;
      try { engine.tickPosition = 0; } catch {}
      try { engine.scrollToCursor(); } catch {}
      setCurrentTime(0);
      setState('stopped');
      setPlayerState('stopped');
      setTransportPosition({ currentTick: 0, endTick: transportPosition.endTick, currentTime: 0, endTime: (player.duration || 0) * 1000 });
    });
    player.addEventListener('error', () => { setState('error'); setError('Busking audio could not be decoded.'); });
    audioRef.current = player;
    return player;
  };

  const loadUrl = async (url: string, name: string): Promise<boolean> => {
    const player = ensureAudio();
    player.pause();
    stopSyncTimer();
    if (objectUrlRef.current && objectUrlRef.current !== url) releaseObjectUrl();
    player.crossOrigin = url.startsWith('blob:') ? '' : 'anonymous';
    player.src = url;
    player.volume = 0.92;
    player.playbackRate = 1;
    player.preservesPitch = true;
    player.load();
    try { engine.stop(); } catch {}
    try { engine.tickPosition = 0; } catch {}
    try { engine.scrollToCursor(); } catch {}
    setFileName(name);
    setState('loading');
    setCurrentTime(0);
    setDuration(0);
    setError('');
    return true;
  };

  const loadRemoteAsBlob = async (url: string, name: string): Promise<boolean> => {
    setState('loading');
    setFileName(name);
    setError('Loading rendered performance audio...');
    try {
      const absoluteUrl = url.startsWith('http') ? url : `${getSoundServerUrl()}${url}`;
      const response = await fetch(`${absoluteUrl}${absoluteUrl.includes('?') ? '&' : '?'}v=${Date.now()}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      if (blob.size <= 44) throw new Error('Downloaded audio blob is empty.');
      releaseObjectUrl();
      const objectUrl = URL.createObjectURL(blob);
      objectUrlRef.current = objectUrl;
      return await loadUrl(objectUrl, name);
    } catch (e) {
      setState('error');
      setError(e instanceof Error ? e.message : String(e));
      return false;
    }
  };

  const loadMaster = async (): Promise<boolean> => {
    if (!masterItem) {
      setState('error');
      setError('No rendered master in current project. Select a generated master from the list or generate a new one.');
      return false;
    }
    const url = masterItem.fileUrl;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/outputs/')) {
      return await loadRemoteAsBlob(url, masterItem.fileName);
    }
    return await loadUrl(url, masterItem.fileName);
  };

  const refreshGeneratedFiles = async () => {
    setIsRefreshingFiles(true);
    try {
      const response = await fetch(`${getSoundServerUrl()}/api/sound/jobs?v=${Date.now()}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json() as { files?: string[]; items?: SoundJobItem[] };
      if (payload.items && payload.items.length > 0) {
        setGeneratedJobs(payload.items);
      } else {
        const fallbackJobs = (payload.files || []).filter((name) => name.toLowerCase().endsWith('.wav')).sort().reverse().map((name) => ({
          fileName: name,
          fileUrl: `/outputs/${name}`,
          metadataFileName: null,
          jobId: name,
          engine: 'unknown',
          projectId: '',
          projectName: '',
          sourceTitle: '',
          sourceArtist: '',
          bpm: 0,
          key: '',
          durationSeconds: 0,
          sampleRate: 0,
          createdAt: '',
          message: '',
          hasMetadata: false,
        }));
        setGeneratedJobs(fallbackJobs);
      }
      setError('');
    } catch (e) {
      setError(e instanceof Error ? `Generated list failed: ${e.message}` : 'Generated list failed.');
    } finally {
      setIsRefreshingFiles(false);
    }
  };

  const playLoadedAudio = async () => {
    const active = ensureAudio();
    try {
      try { engine.stop(); } catch {}
      await active.play();
      startSyncTimer();
    } catch (e) {
      setState('error');
      setError(e instanceof Error ? e.message : 'Busking playback failed.');
    }
  };

  const loadGeneratedJob = async (job: SoundJobItem, autoPlay: boolean = true) => {
    const ok = await loadRemoteAsBlob(job.fileUrl || generatedFileUrl(job.fileName), job.fileName);
    if (ok && autoPlay) await playLoadedAudio();
  };

  const loadLatestGeneratedFile = async (): Promise<boolean> => {
    const candidate = matchedJobs[0] || generatedJobs[0];
    if (candidate) return await loadRemoteAsBlob(candidate.fileUrl || generatedFileUrl(candidate.fileName), candidate.fileName);
    setState('error');
    setError('No generated WAV files found. Refresh the generated masters list or generate Performance Sound first.');
    return false;
  };

  const playPause = async () => {
    const player = ensureAudio();
    if (state === 'playing') {
      player.pause();
      return;
    }

    if (!player.src) {
      let loaded = false;
      if (masterItem) loaded = await loadMaster();
      if (!loaded) loaded = await loadLatestGeneratedFile();
      if (!loaded) return;
    }

    await playLoadedAudio();
  };

  const stop = () => {
    const player = ensureAudio();
    player.pause();
    player.currentTime = 0;
    stopSyncTimer();
    try { engine.tickPosition = 0; } catch {}
    try { engine.scrollToCursor(); } catch {}
    setCurrentTime(0);
    setState('stopped');
    setPlayerState('stopped');
    setTransportPosition({ currentTick: 0, endTick: transportPosition.endTick, currentTime: 0, endTime: duration * 1000 });
  };

  const seekPercent = (percent: number) => {
    const player = ensureAudio();
    const d = Number.isFinite(player.duration) && player.duration > 0 ? player.duration : duration;
    if (d <= 0) return;
    player.currentTime = (Math.max(0, Math.min(100, percent)) / 100) * d;
    syncScoreToAudio();
  };

  useEffect(() => {
    void refreshGeneratedFiles();
  }, []);

  useEffect(() => {
    if (masterItem && state === 'empty') void loadMaster();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [masterItem?.id]);

  useEffect(() => {
    return () => {
      stopSyncTimer();
      releaseObjectUrl();
      audioRef.current?.pause();
      if (audioRef.current) audioRef.current.src = '';
    };
  }, []);

  const renderJobButton = (job: SoundJobItem, isMatched: boolean) => (
    <button key={job.fileName} onClick={() => void loadGeneratedJob(job, true)} className={`w-full text-left rounded border p-2 text-xs transition-colors ${fileName === job.fileName ? 'bg-blue-950/70 border-blue-600 text-blue-100' : isMatched ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-50 hover:bg-emerald-900/50' : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:bg-slate-800'}`}>
      <div className="truncate font-medium">{job.projectName || job.sourceTitle || job.fileName}</div>
      <div className="truncate text-[10px] text-slate-500 mt-0.5">{job.fileName}</div>
      <div className="text-[10px] text-slate-500 mt-0.5">
        {job.hasMetadata ? `${job.engine} · ${job.key || '-'} · ${job.bpm || '-'} BPM · ${job.durationSeconds ? formatTime(job.durationSeconds) : '--:--'}` : 'Legacy WAV · no metadata'}
      </div>
    </button>
  );

  if (!currentPlan) {
    return (
      <div className="absolute inset-0 z-20 bg-[#0f172a] text-slate-300 flex items-center justify-center p-8">
        <div className="max-w-[560px] rounded-2xl bg-slate-900 border border-slate-700 p-8 text-center">
          <Mic2 size={42} className="mx-auto text-blue-400 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Busking Set Not Prepared</h2>
          <p className="text-sm text-slate-500 leading-relaxed mb-5">Prepare a busking version first.</p>
          <div className="flex justify-center gap-2">
            <button onClick={() => setMode('arrange')} className="h-9 px-4 rounded bg-slate-800 hover:bg-slate-700 text-sm text-slate-200">Go to Arrange</button>
            <button onClick={() => preparePlan()} className="h-9 px-4 rounded bg-blue-600 hover:bg-blue-500 text-sm text-white flex items-center gap-2"><RefreshCw size={14} /> Auto Prepare</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-20 pointer-events-none">
      <div className="absolute left-4 right-[410px] bottom-4 pointer-events-auto rounded-2xl border border-blue-700/40 bg-slate-950/92 backdrop-blur p-4 shadow-2xl">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-blue-300 text-xs font-semibold uppercase tracking-wider"><MonitorPlay size={15} /> Busking Sync Playback</div>
            <div className="mt-1 flex items-center gap-3 min-w-0">
              <h1 className="text-xl font-bold text-white truncate">{project.name || currentPlan.title}</h1>
              <span className="text-xs text-slate-400 shrink-0">{currentPlan.recommendedKey} · Capo {currentPlan.capo} · {currentPlan.performanceBpm} BPM · {formatGoalLabel(currentPlan.goal)}</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500 truncate">{fileName || 'Select a generated master from the list.'}</div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => void loadMaster()} disabled={!masterItem} className="h-9 px-3 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-100 text-xs flex items-center gap-1.5"><Music size={14} /> Current Master</button>
            <button onClick={() => void playPause()} className="h-10 px-5 rounded bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold flex items-center gap-2">{state === 'playing' ? <Pause size={15} /> : <Play size={15} />}{state === 'playing' ? 'Pause' : 'Play'}</button>
            <button onClick={stop} className="h-10 px-3 rounded bg-slate-800 hover:bg-slate-700 text-slate-100"><Square size={15} /></button>
            <button onClick={() => setMode('backing')} className="h-9 px-3 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-xs">Backing</button>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-[auto_1fr_auto] items-center gap-3">
          <div className="text-xs tabular-nums text-slate-400 w-28">{formatTime(currentTime)} / {formatTime(duration)}</div>
          <input type="range" min={0} max={100} value={progress} onChange={(e) => seekPercent(Number(e.target.value))} className="w-full" />
          <div className="text-xs text-slate-400 w-24 text-right">State: {state}</div>
        </div>
        {mismatchWarning && <div className="mt-2 rounded border border-yellow-500/40 bg-yellow-950/40 px-2 py-1.5 text-[11px] text-yellow-100">{mismatchWarning}</div>}
        {error && <div className="mt-2 rounded border border-red-500/40 bg-red-950/50 px-2 py-1.5 text-[11px] text-red-100">{error}</div>}
      </div>

      <div className="absolute right-4 top-4 bottom-4 w-[380px] pointer-events-auto overflow-auto rounded-2xl border border-slate-700 bg-slate-950/88 backdrop-blur p-4 shadow-2xl">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-xl bg-slate-900 border border-slate-700 p-3">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">RenderCache</div>
            <div className="text-lg font-bold text-white">{project.renderCache?.masterStatus || 'empty'}</div>
          </div>
          <div className="rounded-xl bg-slate-900 border border-slate-700 p-3">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Score Sync</div>
            <div className="text-lg font-bold text-white">{transportPosition.endTick > 0 ? 'Ready' : 'Waiting'}</div>
          </div>
        </div>

        <section className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-white"><Music size={15} /> Generated Masters</div>
            <button onClick={() => void refreshGeneratedFiles()} className="h-7 px-2 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 flex items-center gap-1"><RefreshCw size={12} className={isRefreshingFiles ? 'animate-spin' : ''} /> Refresh</button>
          </div>
          <div className="space-y-1 max-h-64 overflow-auto pr-1">
            {generatedJobs.length === 0 && <div className="rounded bg-slate-900/90 border border-slate-800 p-3 text-xs text-slate-500">No generated WAV files found yet.</div>}
            {matchedJobs.length > 0 && <div className="text-[10px] uppercase tracking-wider text-emerald-400 mt-1 mb-1">Matching current score</div>}
            {matchedJobs.map((job) => renderJobButton(job, true))}
            {otherJobs.length > 0 && <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-3 mb-1">Other generated masters</div>}
            {otherJobs.map((job) => renderJobButton(job, false))}
          </div>
        </section>

        <section className="mb-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white mb-2"><Route size={15} /> Stage Route</div>
          <div className="space-y-2">
            {currentPlan.sections.map((section, index) => (
              <div key={section.id} className="rounded bg-slate-900/90 border border-slate-800 p-3">
                <div className="flex items-center justify-between"><div className="text-slate-100 font-semibold text-sm">{index + 1}. {section.name}</div><div className="text-xs text-slate-500">{section.bars}</div></div>
                <div className="text-xs text-blue-300 mt-2">{section.performanceCue}</div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 text-sm font-semibold text-white mb-2"><Sparkles size={15} /> Live Cues</div>
          <div className="space-y-2">
            {currentPlan.buskingCues.map((cue, index) => (
              <div key={index} className="flex gap-2 rounded bg-slate-900/90 border border-slate-800 p-2.5">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">{index + 1}</div>
                <div className="text-xs text-slate-300 leading-relaxed">{cue}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
