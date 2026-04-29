import React from 'react';
import { Pause, Play, Repeat, Square, Volume2 } from 'lucide-react';
import { useBuskingStore } from '../../stores/buskingStore';

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const total = Math.floor(seconds);
  const min = Math.floor(total / 60);
  const sec = total % 60;
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export interface BuskingTransportBarProps {
  state: string;
  currentTime: number;
  duration: number;
  progress: number;
  disabled?: boolean;
  onPlayPause: () => void;
  onStop: () => void;
  onSeekPercent: (percent: number) => void;
}

export function BuskingTransportBar(props: BuskingTransportBarProps) {
  const masterVolume = useBuskingStore((s) => s.masterVolume);
  const scoreGuideVolume = useBuskingStore((s) => s.scoreGuideVolume);
  const loop = useBuskingStore((s) => s.loop);
  const setMasterVolume = useBuskingStore((s) => s.setMasterVolume);
  const setScoreGuideVolume = useBuskingStore((s) => s.setScoreGuideVolume);
  const setLoopStart = useBuskingStore((s) => s.setLoopStart);
  const setLoopEnd = useBuskingStore((s) => s.setLoopEnd);
  const setLoopEnabled = useBuskingStore((s) => s.setLoopEnabled);
  const clearLoop = useBuskingStore((s) => s.clearLoop);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs tabular-nums text-slate-400 w-28">
          {formatTime(props.currentTime)} / {formatTime(props.duration)}
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={props.progress}
          disabled={props.disabled}
          onChange={(e) => props.onSeekPercent(Number(e.target.value))}
          className="w-full"
        />
        <div className="text-xs text-slate-400 w-24 text-right">State: {props.state}</div>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={props.onPlayPause} disabled={props.disabled} className="h-10 px-5 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-semibold flex items-center gap-2">
          {props.state === 'playing' ? <Pause size={15} /> : <Play size={15} />}
          {props.state === 'playing' ? 'Pause' : 'Play'}
        </button>
        <button onClick={props.onStop} disabled={props.disabled} className="h-10 px-3 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-100">
          <Square size={15} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex items-center gap-2 text-[11px] text-slate-400">
          <Volume2 size={13} /> Master {Math.round(masterVolume * 100)}
          <input type="range" min={0} max={100} value={Math.round(masterVolume * 100)} onChange={(e) => setMasterVolume(Number(e.target.value) / 100)} className="w-full" />
        </label>
        <label className="flex items-center gap-2 text-[11px] text-slate-400">
          Guide {Math.round(scoreGuideVolume * 100)}
          <input type="range" min={0} max={10} value={Math.round(scoreGuideVolume * 100)} onChange={(e) => setScoreGuideVolume(Number(e.target.value) / 100)} className="w-full" />
        </label>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-slate-400">
        <Repeat size={13} />
        <button onClick={() => setLoopStart(props.currentTime)} className="h-7 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-100">Set A {formatTime(loop.startSeconds)}</button>
        <button onClick={() => setLoopEnd(props.currentTime)} className="h-7 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-100">Set B {formatTime(loop.endSeconds)}</button>
        <button onClick={() => setLoopEnabled(!loop.enabled)} className={`h-7 px-2 rounded ${loop.enabled ? 'bg-blue-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-100'}`}>Loop {loop.enabled ? 'On' : 'Off'}</button>
        <button onClick={clearLoop} className="h-7 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-100">Clear</button>
      </div>
    </div>
  );
}
