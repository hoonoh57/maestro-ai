import React from 'react';
import { useUIStore } from '../../stores/uiStore';
import { ScoreCanvas } from '../editor/ScoreCanvas';
import { TestConsole } from '../modes/TestConsole';
import { TrackMixerPanel } from '../mixer/TrackMixerPanel';
import { BackingInspector } from '../inspector/BackingInspector';
import { BuskingArrangePanel } from '../arranger/BuskingArrangePanel';
import { PracticeWorkflowPanel } from '../practice/PracticeWorkflowPanel';
import { BuskingWorkflowPanel } from '../busking/BuskingWorkflowPanel';

function BackingModePanel() {
  return (
    <div className="absolute inset-0 z-20 bg-[#0f172a]/95 text-slate-200 overflow-auto">
      <div className="max-w-[520px] mx-auto py-8 px-4">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-white">Performance Audio Playback</h2>
          <p className="text-sm text-slate-500 mt-1">
            Import a finished MP3/WAV/MR/stem track for stage-quality playback. Score playback remains available underneath for preview and notation work.
          </p>
        </div>
        <BackingInspector />
      </div>
    </div>
  );
}

export function MainViewport() {
  const mode = useUIStore((s) => s.mode);

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      <ScoreCanvas />

      {mode === 'test' && (
        <div className="absolute inset-0 z-20 bg-[#0f172a]">
          <TestConsole />
        </div>
      )}
      {mode === 'arrange' && <BuskingArrangePanel />}
      {mode === 'practice' && <PracticeWorkflowPanel />}
      {mode === 'backing' && <BackingModePanel />}
      {mode === 'busking' && <BuskingWorkflowPanel />}
      {mode === 'mixer' && <TrackMixerPanel />}
    </div>
  );
}
