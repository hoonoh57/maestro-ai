// ─────────────────────────────────────────────────
// src/components/editor/ScoreCanvas.tsx
// alphaTab을 마운트하고 렌더링하는 핵심 컴포넌트
// ─────────────────────────────────────────────────

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAlphaTab } from '../../hooks/useAlphaTab';
import { useTransportStore } from '../../stores/transportStore';
import { useUIStore } from '../../stores/uiStore';
import { inspectImportFile } from '../../services/import/FileImportService';
import { ImportCenter } from '../import/ImportCenter';
import { PromptSongDialog } from '../import/PromptSongDialog';
import { Music } from 'lucide-react';

function formatReadyText(value: boolean): string {
  return value ? 'ready' : 'waiting';
}

export function ScoreCanvas() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [readyToInit, setReadyToInit] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const importCenterVisible = useUIStore((s) => s.importCenterVisible);
  const openImportCenter = useUIStore((s) => s.openImportCenter);
  const closeImportCenter = useUIStore((s) => s.closeImportCenter);

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

  const {
    importFile,
    loadTexScore,
    loadDemoScore,
    diagnostics,
    initialized,
    lastError,
  } = useAlphaTab(
    containerRef,
    viewportRef,
    readyToInit,
  );

  const isReady = useTransportStore((s) => s.isPlayerReady);
  const sfPct = useTransportStore((s) => s.sfProgress);

  const showSoundFontOverlay = readyToInit && initialized && !isReady;
  const scoreLoaded = diagnostics.scoreLoadedCount > 0;
  const showImportCenter = readyToInit && initialized && !showSoundFontOverlay && (!scoreLoaded || importCenterVisible);
  const visibleError = lastError ?? diagnostics.lastError;

  const diagnosticText = useMemo(() => {
    return [
      `init:${formatReadyText(initialized)}`,
      `player:${formatReadyText(isReady)}`,
      `sf:${sfPct}%`,
      `profile:${diagnostics.playbackProfile ?? 'n/a'}`,
      `buf:${diagnostics.bufferTimeInMilliseconds ?? 0}ms`,
      `score:${diagnostics.scoreLoadedCount}`,
      `render:${diagnostics.renderFinishedCount}`,
      `tracks:${diagnostics.trackCount}`,
      `size:${diagnostics.lastContainerWidth}x${diagnostics.lastContainerHeight}`,
    ].join('  |  ');
  }, [diagnostics, initialized, isReady, sfPct]);

  const closeImportUi = useCallback(() => {
    setPromptOpen(false);
    closeImportCenter();
  }, [closeImportCenter]);

  const openImportFile = useCallback((file: File) => {
    const info = inspectImportFile(file);
    if (!info.canLoadDirectly) {
      setInfoMessage(info.message);
      return;
    }
    setInfoMessage(null);
    importFile(file);
    closeImportUi();
  }, [closeImportUi, importFile]);

  const handleLoadDemo = useCallback(() => {
    loadDemoScore();
    closeImportUi();
  }, [closeImportUi, loadDemoScore]);

  const handleGenerateTex = useCallback((tex: string) => {
    loadTexScore(tex);
    closeImportUi();
  }, [closeImportUi, loadTexScore]);

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
      if (file) openImportFile(file);
    },
    [openImportFile]
  );

  return (
    <div
      className="relative flex-1 flex flex-col overflow-hidden bg-[#1e293b]"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {scoreLoaded && !showImportCenter && (
        <button
          onClick={openImportCenter}
          className="absolute left-3 top-3 z-20 rounded-lg border border-slate-700/70 bg-slate-950/70 px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:border-blue-500/70 hover:bg-slate-900 transition"
        >
          Import / AI
        </button>
      )}

      <div className="absolute top-2 right-2 z-20 rounded bg-slate-950/70 border border-slate-700/60 px-2 py-1 text-[10px] text-slate-400 font-mono pointer-events-none max-w-[720px] truncate">
        {diagnosticText}
      </div>

      {visibleError && (
        <div className="absolute left-3 right-3 top-10 z-40 rounded border border-red-500/40 bg-red-950/70 px-3 py-2 text-xs text-red-100 shadow-lg">
          {visibleError}
        </div>
      )}

      {infoMessage && (
        <div className="absolute left-3 right-3 top-10 z-40 rounded border border-blue-500/40 bg-blue-950/80 px-3 py-2 text-xs text-blue-100 shadow-lg flex items-center justify-between gap-3">
          <span>{infoMessage}</span>
          <button onClick={() => setInfoMessage(null)} className="text-blue-200 hover:text-white">닫기</button>
        </div>
      )}

      {isDragging && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center border-2 border-dashed border-blue-400 bg-blue-950/40 text-blue-100 pointer-events-none">
          <Music className="w-8 h-8 mb-2" />
          <div className="text-sm font-semibold">Drop Guitar Pro / MusicXML / alphaTex file</div>
          <div className="text-xs text-blue-200/80 mt-1">PDF and image scores will be routed to OMR preparation.</div>
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

      {showImportCenter && (
        <ImportCenter
          onOpenFile={openImportFile}
          onOpenPrompt={() => setPromptOpen(true)}
          onLoadDemo={handleLoadDemo}
          onShowOmrInfo={setInfoMessage}
          onClose={scoreLoaded ? closeImportUi : undefined}
        />
      )}

      {promptOpen && (
        <PromptSongDialog
          onClose={() => setPromptOpen(false)}
          onGenerate={handleGenerateTex}
        />
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
