// ─────────────────────────────────────────────────
// src/components/editor/ScoreCanvas.tsx
// alphaTab을 마운트하고 렌더링하는 핵심 컴포넌트
// ─────────────────────────────────────────────────

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAlphaTab } from '../../hooks/useAlphaTab';
import { useTransportStore } from '../../stores/transportStore';
import { Music } from 'lucide-react';

function formatReadyText(value: boolean): string {
  return value ? 'ready' : 'waiting';
}

export function ScoreCanvas() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [readyToInit, setReadyToInit] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const viewport = viewportRef.current;
    if (container === null || viewport === null) return;

    const checkSize = () => {
      const containerRect = container.getBoundingClientRect();
      const viewportRect = viewport.getBoundingClientRect();
      const canInit =
        containerRect.width > 0 &&
        containerRect.height > 0 &&
        viewportRect.width > 0 &&
        viewportRect.height > 0;
      setReadyToInit(canInit);
    };

    checkSize();

    const observer = new ResizeObserver(checkSize);
    observer.observe(container);
    observer.observe(viewport);

    const timer = window.setTimeout(checkSize, 80);

    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  const { importFile, diagnostics, initialized, lastError } = useAlphaTab(
    containerRef,
    viewportRef,
    readyToInit,
  );

  const isReady = useTransportStore((s) => s.isPlayerReady);
  const sfPct = useTransportStore((s) => s.sfProgress);

  const showSoundFontOverlay = readyToInit && initialized && !isReady;
  const showEmptyHint = readyToInit && initialized && diagnostics.scoreLoadedCount === 0;
  const visibleError = lastError ?? diagnostics.lastError;

  const diagnosticText = useMemo(() => {
    return [
      `init:${formatReadyText(initialized)}`,
      `player:${formatReadyText(isReady)}`,
      `score:${diagnostics.scoreLoadedCount}`,
      `render:${diagnostics.renderFinishedCount}`,
      `tracks:${diagnostics.trackCount}`,
      `size:${diagnostics.lastContainerWidth}x${diagnostics.lastContainerHeight}`,
    ].join('  |  ');
  }, [diagnostics, initialized, isReady]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  }, [isDragging]);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const file = e.dataTransfer?.files?.[0];
      if (file) importFile(file);
    },
    [importFile]
  );

  return (
    <div
      className="relative flex-1 flex flex-col overflow-hidden bg-[#1e293b]"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="absolute top-2 right-2 z-20 rounded bg-slate-950/70 border border-slate-700/60 px-2 py-1 text-[10px] text-slate-400 font-mono pointer-events-none">
        {diagnosticText}
      </div>

      {visibleError && (
        <div className="absolute left-3 right-3 top-10 z-40 rounded border border-red-500/40 bg-red-950/70 px-3 py-2 text-xs text-red-100 shadow-lg">
          {visibleError}
        </div>
      )}

      {isDragging && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center border-2 border-dashed border-blue-400 bg-blue-950/40 text-blue-100 pointer-events-none">
          <Music className="w-8 h-8 mb-2" />
          <div className="text-sm font-semibold">Drop Guitar Pro / MusicXML file</div>
          <div className="text-xs text-blue-200/80 mt-1">alphaTab will load and render it immediately.</div>
        </div>
      )}

      {!readyToInit && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#0f172a]/80 text-slate-400">
          <Music className="w-7 h-7 mb-2 text-slate-500" />
          <p className="text-sm">Preparing score viewport…</p>
        </div>
      )}

      {showSoundFontOverlay && (
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

      {showEmptyHint && !showSoundFontOverlay && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="rounded-xl border border-slate-700/70 bg-slate-950/50 px-5 py-4 text-center shadow-xl">
            <Music className="w-8 h-8 mx-auto mb-2 text-slate-500" />
            <div className="text-sm text-slate-300 font-semibold">Score engine is ready</div>
            <div className="text-xs text-slate-500 mt-1">Drop a Guitar Pro or MusicXML file to load a song.</div>
          </div>
        </div>
      )}

      <div
        ref={viewportRef}
        className="flex-1 overflow-auto relative"
      >
        <div
          ref={containerRef}
          className="at-main min-h-full"
          style={{ width: '100%', minHeight: 640, padding: '24px 32px 80px 32px' }}
        />
      </div>
    </div>
  );
}
