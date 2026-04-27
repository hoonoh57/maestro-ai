// ─────────────────────────────────────────────────
// src/components/editor/ScoreCanvas.tsx
// alphaTab을 마운트하고 렌더링하는 핵심 컴포넌트
// ─────────────────────────────────────────────────

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { useAlphaTab } from '../../hooks/useAlphaTab';
import { useTransportStore } from '../../stores/transportStore';
import { Music } from 'lucide-react';

export function ScoreCanvas() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // 컨테이너가 실제로 화면에 보이는지 감지
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // ResizeObserver로 크기가 잡히는 순간 감지
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          setIsVisible(true);
          ro.disconnect();
        }
      }
    });
    ro.observe(el);

    return () => ro.disconnect();
  }, []);

  // isVisible이 true가 된 후에만 alphaTab 초기화
  const { importFile } = useAlphaTab(
    isVisible ? containerRef : { current: null },
    isVisible ? viewportRef : { current: null }
  );

  const isReady = useTransportStore((s) => s.isPlayerReady);
  const sfPct = useTransportStore((s) => s.sfProgress);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const f = e.dataTransfer?.files?.[0];
      if (f) importFile(f);
    },
    [importFile]
  );

  return (
    <div
      className="relative flex-1 flex flex-col overflow-hidden bg-[#1e293b]"
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* SoundFont 로딩 오버레이 */}
      {isVisible && !isReady && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#0f172a]/80 backdrop-blur-sm">
          <p className="text-slate-400 text-sm mb-2">Loading SoundFont…</p>
          <div className="w-48 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${sfPct}%` }}
            />
          </div>
          <p className="text-slate-500 text-[11px] mt-1">{sfPct}%</p>
        </div>
      )}

      {/* 스크롤 뷰포트 */}
      <div
        ref={viewportRef}
        className="flex-1 overflow-auto relative"
      >
        {/* alphaTab이 여기에 렌더링 */}
        <div
          ref={containerRef}
          className="at-main"
          style={{ width: '100%', minHeight: '100%' }}
        />
      </div>
    </div>
  );
}
