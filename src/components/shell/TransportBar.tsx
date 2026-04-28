import React from 'react';
import { engine } from '../../core/AlphaTabEngine';
import { useTransportStore } from '../../stores/transportStore';
import { useProjectStore } from '../../stores/projectStore';
import { Slider } from '../shared/Slider';
import { IconButton } from '../shared/IconButton';
import { Play, Square, Pause, Repeat, Timer, Gauge, Mic } from 'lucide-react';

const fmt = (ms: number) => {
  if (!ms || !isFinite(ms) || ms < 0) return '00:00';
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

export function TransportBar() {
  const playerState = useTransportStore((s) => s.playerState);
  const position = useTransportStore((s) => s.position);
  const masterVolume = useTransportStore((s) => s.masterVolume);
  const setMasterVolume = useTransportStore((s) => s.setMasterVolume);
  const bpm = useProjectStore((s) => s.project.bpm);
  const setBpm = useProjectStore((s) => s.setBpm);
  const key = useProjectStore((s) => s.project.key);
  const ts = useProjectStore((s) => s.project.timeSignature);

  const isPlaying = playerState === 'playing';

  return (
    <div className="h-11 bg-[#0f172a] border-b border-slate-700/60 flex items-center px-4 gap-3 shrink-0">
      <div className="flex items-center gap-1">
        <IconButton
          icon={isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          active={isPlaying}
          onClick={() => engine.safePlayPause()}
          title="Play/Pause (Space)"
        />
        <IconButton
          icon={<Square className="w-4 h-4" />}
          onClick={() => engine.stop()}
          title="Stop"
        />
        <IconButton
          icon={<Mic className="w-4 h-4" />}
          disabled
          title="Record (추후 지원)"
        />
      </div>

      <div className="w-px h-6 bg-slate-700/60" />

      <div className="flex items-center gap-1 opacity-40">
        <IconButton icon={<Repeat className="w-4 h-4" />} disabled title="Loop (Phase 3)" />
        <IconButton icon={<Timer className="w-4 h-4" />} disabled title="Count-In (Phase 3)" />
        <IconButton icon={<span className="text-xs font-bold">♪</span>} disabled title="Metronome (Phase 3)" />
        <IconButton icon={<Gauge className="w-4 h-4" />} disabled title="Speed Trainer (Phase 3)" />
      </div>

      <div className="w-px h-6 bg-slate-700/60" />

      <div className="flex items-center gap-1">
        <span className="text-xs text-slate-500">BPM</span>
        <input
          type="number"
          value={bpm}
          onChange={(e) => setBpm(Number(e.target.value))}
          className="w-12 bg-slate-800 border border-slate-700/50 rounded px-1.5 py-0.5 text-xs text-white text-center outline-none focus:border-blue-500 tabular-nums"
          min={20}
          max={300}
        />
      </div>

      <div className="flex items-center gap-1">
        <span className="text-xs text-slate-500">Key</span>
        <span className="text-xs text-white bg-slate-800 border border-slate-700/50 rounded px-2 py-0.5">{key}</span>
      </div>

      <span className="text-xs text-slate-400 tabular-nums">{ts}</span>

      <div className="w-px h-6 bg-slate-700/60" />

      <span className="text-sm text-white font-mono tabular-nums bg-slate-800 border border-slate-700/50 rounded px-2 py-0.5">
        {fmt(position.currentTime)} / {fmt(position.endTime)}
      </span>

      <div className="flex-1" />

      <div className="flex items-center gap-2 w-36">
        <span className="text-xs text-slate-500">Vol</span>
        <Slider
          value={masterVolume}
          onChange={(v) => {
            setMasterVolume(v);
            engine.setMasterVolume(v / 100);
          }}
        />
      </div>
    </div>
  );
}
