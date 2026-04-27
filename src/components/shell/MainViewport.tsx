import React from 'react';
import { useUIStore } from '../../stores/uiStore';
import { ScoreCanvas } from '../editor/ScoreCanvas';
import { TestConsole } from '../modes/TestConsole';

function PlaceholderMode({ title, phase }: { title: string; phase: number }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#1e293b] text-slate-500">
      <span className="text-xl font-semibold mb-1">{title}</span>
      <span className="text-[12px]">Phase {phase} — Coming Soon</span>
    </div>
  );
}

export function MainViewport() {
  const mode = useUIStore((s) => s.mode);

  switch (mode) {
    case 'editor':
      return <ScoreCanvas />;
    case 'test':
      return <TestConsole />;
    case 'practice':
      return <PlaceholderMode title="Practice Mode" phase={6} />;
    case 'backing':
      return <PlaceholderMode title="Backing Track" phase={5} />;
    case 'busking':
      return <PlaceholderMode title="Busking Mode" phase={4} />;
    case 'mixer':
      return <PlaceholderMode title="Mixer" phase={7} />;
    default:
      return <ScoreCanvas />;
  }
}

function LoadingPlaceholder() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-slate-500 text-sm">Loading...</div>
    </div>
  );
}