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

  // ScoreCanvas는 항상 마운트 (engine 유지), 다른 모드에서는 숨김
  const showScore = mode === 'editor';
  const showTest = mode === 'test';

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      {/* ScoreCanvas: 항상 DOM에 존재, 숨길 때는 뒤로 보냄 */}
      <div
        className="absolute inset-0"
        style={{
          zIndex: showScore ? 1 : 0,
          visibility: showScore ? 'visible' : 'hidden',
          pointerEvents: showScore ? 'auto' : 'none',
        }}
      >
        <ScoreCanvas />
      </div>

      {/* Test Console */}
      {showTest && (
        <div className="absolute inset-0 z-10">
          <TestConsole />
        </div>
      )}

      {/* Other modes */}
      {mode === 'practice' && <PlaceholderMode title="Practice Mode" phase={6} />}
      {mode === 'backing' && <PlaceholderMode title="Backing Track" phase={5} />}
      {mode === 'busking' && <PlaceholderMode title="Busking Mode" phase={4} />}
      {mode === 'mixer' && <PlaceholderMode title="Mixer" phase={7} />}
    </div>
  );
}
