import React from 'react';
import { engine } from '@/core/AlphaTabEngine';
import { useTransportStore } from '@/stores/transportStore';
import { useProjectStore } from '@/stores/projectStore';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { IconButton } from '@/components/shared/IconButton';
import { Slider } from '@/components/shared/Slider';
import { Play, Square, Pause, Repeat, Timer, Metronome, Gauge, Mic } from 'lucide-react';

export function TransportBar() {
  const isPlaying = useTransportStore((s) => s.isPlaying);
  const position = useTransportStore((s) => s.position);
  const masterVolume = useTransportStore((s) => s.masterVolume);
  const setMasterVolume = useTransportStore((s) => s.setMasterVolume);
  const bpm = useProjectStore((s) => s.project.bpm);
  const setBpm = useProjectStore((s) => s.setBpm);
  const key = useProjectStore((s) => s.project.key);
  const ts = useProjectStore((s) => s.project.timeSignature);

  const { isActive: loopActive } = useFeatureFlag('loop_region');
  const { isActive: metronomeActive } = useFeatureFlag('metronome');
  const { isActive: countInActive } = useFeatureFlag('count_in');
  const { isActive: speedTrainerActive } = useFeatureFlag('speed_trainer');

  const handlePlay = () => engine.play();
  const handleStop = () => engine.stop();
  const handlePause = () => engine.pause();

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-11 bg-daw-bg border-b border-daw-grid flex items-center px-4 gap-3 shrink-0">
      {/* Playback Controls */}
      <div className="flex items-center gap-1">
        <IconButton
          icon={<Play className="w-4 h-4" />}
          active={isPlaying}
          onClick={handlePlay}
          title="Play (Space)"
        />
        <IconButton
          icon={<Square className="w-4 h-4" />}
          onClick={handleStop}
          title="Stop"
        />
        <IconButton
          icon={<Pause className="w-4 h-4" />}
          onClick={handlePause}
          title="Pause"
        />
        <IconButton
          icon={<Mic className="w-4 h-4" />}
          disabled
          title="Record (추후 지원)"
        />
      </div>

      <div className="w-px h-6 bg-daw-grid" />

      {/* Transport Toggles — Phase 3 locked 항목은 disabled */}
      <div className="flex items-center gap-1">
        <div className={!loopActive ? 'opacity-40 cursor-not-allowed' : ''} title={!loopActive ? 'Phase 3에서 활성화' : 'Loop'}>
          <IconButton icon={<Repeat className="w-4 h-4" />} disabled={!loopActive} title="Loop" />
        </div>
        <div className={!countInActive ? 'opacity-40 cursor-not-allowed' : ''} title={!countInActive ? 'Phase 3에서 활성화' : 'Count-In'}>
          <IconButton icon={<Timer className="w-4 h-4" />} disabled={!countInActive} title="Count-In" />
        </div>
        <div className={!metronomeActive ? 'opacity-40 cursor-not-allowed' : ''} title={!metronomeActive ? 'Phase 3에서 활성화' : 'Metronome'}>
          <IconButton icon={<span className="text-xs font-bold">♪</span>} disabled={!metronomeActive} title="Metronome" />
        </div>
        <div className={!speedTrainerActive ? 'opacity-40 cursor-not-allowed' : ''} title={!speedTrainerActive ? 'Phase 3에서 활성화' : 'Speed Trainer'}>
          <IconButton icon={<Gauge className="w-4 h-4" />} disabled={!speedTrainerActive} title="Speed Trainer" />
        </div>
      </div>

      <div className="w-px h-6 bg-daw-grid" />

      {/* BPM */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-slate-500">BPM</span>
        <input
          type="number"
          value={bpm}
          onChange={(e) => setBpm(Number(e.target.value))}
          className="w-12 bg-daw-panel border border-daw-grid rounded px-1.5 py-0.5 text-xs text-white 
                     text-center outline-none focus:border-daw-accent tabular-nums"
          min={20}
          max={300}
        />
      </div>

      {/* Key */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-slate-500">Key</span>
        <span className="text-xs text-white bg-daw-panel border border-daw-grid rounded px-2 py-0.5">
          {key}
        </span>
      </div>

      {/* Time Signature */}
      <span className="text-xs text-slate-400 tabular-nums">{ts.numerator}/{ts.denominator}</span>

      <div className="w-px h-6 bg-daw-grid" />

      {/* Position */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">Pos</span>
        <span className="text-sm text-white font-mono tabular-nums bg-daw-panel border border-daw-grid rounded px-2 py-0.5">
          M{position.measure} B{position.beat}
        </span>
      </div>

      {/* Time */}
      <span className="text-xs text-slate-400 tabular-nums">
        {formatTime(position.timeMs)} / {formatTime(position.totalTimeMs)}
      </span>

      <div className="flex-1" />

      {/* Master Volume */}
      <div className="flex items-center gap-2 w-36">
        <span className="text-xs text-slate-500">Vol</span>
        <Slider
          value={masterVolume}
          onChange={(v) => {
            setMasterVolume(v);
            engine.masterVolume = v / 100;
          }}
        />
      </div>
    </div>
  );
}