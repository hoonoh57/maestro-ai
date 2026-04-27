import React from 'react';
import { useUIStore } from '../../stores/uiStore';
import { ScoreCanvas } from '../editor/ScoreCanvas';
import { TestConsole } from '../modes/TestConsole';

function PlaceholderMode({ title, phase }: { title: string; phase: number }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1e293b] text-slate-500 z-10">
      <span className="text-xl font-semibold mb-1">{title}</span>
      <span className="text-[12px]">Phase {phase} — Coming Soon</span>
    </div>
  );
}

export function MainViewport() {
  const mode = useUIStore((s) => s.mode);

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      {/* ScoreCanvas: 항상 렌더, 항상 전체 크기 차지 */}
      <ScoreCanvas />

      {/* 다른 모드일 때 위에 오버레이 */}
      {mode === 'test' && (
        <div className="absolute inset-0 z-20 bg-[#0f172a]">
          <TestConsole />
        </div>
      )}
      {mode === 'practice' && <PlaceholderMode title="Practice Mode" phase={6} />}
      {mode === 'backing' && <PlaceholderMode title="Backing Track" phase={5} />}
      {mode === 'busking' && <PlaceholderMode title="Busking Mode" phase={4} />}
      {mode === 'mixer' && <PlaceholderMode title="Mixer" phase={7} />}
    </div>
  );
}
