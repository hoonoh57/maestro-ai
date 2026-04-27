import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type * as alphaTab from '@coderline/alphatab';
import { engine, type EngineDiagnostics } from '../core/AlphaTabEngine';
import { useProjectStore } from '../stores/projectStore';
import { useTransportStore } from '../stores/transportStore';
import { useEditorStore } from '../stores/editorStore';

const DEMO_TEX = `
\\title "MaestroAI Demo"
\\artist "Demo Artist"
\\tempo 120

\\track "Acoustic Guitar"
  \\staff{tabs}
  \\tuning e5 b4 g4 d4 a3 e3
  :4 0.1 2.2 2.3 0.4 |
  0.1 0.2 1.3 2.4 |
  3.1 2.2 0.3 0.4 |
  2.1 2.2 2.3 0.4 |
  0.1 2.2 2.3 0.4 |
  0.1 0.2 1.3 2.4 |
  3.1 2.2 0.3 0.4 |
  2.1 2.2 2.3 0.4

\\track "Bass"
  \\staff{tabs}
  \\tuning g3 d3 a2 e2
  :4 3.4 3.4 5.3 5.3 |
  3.4 3.4 0.3 0.3 |
  0.4 0.4 2.3 2.3 |
  3.4 3.4 5.3 5.3 |
  3.4 3.4 5.3 5.3 |
  3.4 3.4 0.3 0.3 |
  0.4 0.4 2.3 2.3 |
  3.4 3.4 5.3 5.3
`.trim();

interface UseAlphaTabResult {
  engine: typeof engine;
  importFile: (file: File) => void;
  diagnostics: EngineDiagnostics;
  initialized: boolean;
  lastError: string | null;
}

function hasRenderableSize(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

export function useAlphaTab(
  containerRef: RefObject<HTMLElement | null>,
  viewportRef: RefObject<HTMLElement | null>,
  readyToInit: boolean,
): UseAlphaTabResult {
  const initialized = useRef(false);
  const demoLoaded = useRef(false);
  const retryTimer = useRef<number | null>(null);
  const [diagnostics, setDiagnostics] = useState<EngineDiagnostics>(() => engine.getDiagnostics());
  const [lastError, setLastError] = useState<string | null>(null);

  const refreshDiagnostics = useCallback(() => {
    setDiagnostics(engine.getDiagnostics());
  }, []);

  const clearRetryTimer = useCallback(() => {
    if (retryTimer.current !== null) {
      window.clearTimeout(retryTimer.current);
      retryTimer.current = null;
    }
  }, []);

  const tryInitialize = useCallback(() => {
    if (!readyToInit || initialized.current) return;

    const container = containerRef.current;
    const viewport = viewportRef.current;
    if (container === null || viewport === null) return;

    if (!hasRenderableSize(container)) {
      clearRetryTimer();
      retryTimer.current = window.setTimeout(tryInitialize, 120);
      return;
    }

    const ok = engine.init(container, viewport, {
      onScoreLoaded: (score: alphaTab.model.Score) => {
        useProjectStore.getState().syncFromScore(score);
        refreshDiagnostics();
      },
      onPlayerReady: () => {
        useTransportStore.getState().setPlayerReady();
        refreshDiagnostics();
      },
      onPlayerStateChanged: (state) => {
        useTransportStore.getState().setPlayerState(state);
      },
      onPositionChanged: (pos) => {
        useTransportStore.getState().setPosition(pos);
      },
      onSoundFontProgress: (pct) => {
        useTransportStore.getState().setSfProgress(pct);
      },
      onBeatMouseDown: (beat) => {
        useEditorStore.getState().selectBeat(beat);
      },
      onNoteMouseDown: (note) => {
        useEditorStore.getState().selectNoteFromModel(note);
        engine.playNote(note);
      },
      onRenderFinished: () => {
        refreshDiagnostics();
      },
      onError: (e) => {
        setLastError(e.message);
        refreshDiagnostics();
      },
    });

    if (!ok) {
      refreshDiagnostics();
      clearRetryTimer();
      retryTimer.current = window.setTimeout(tryInitialize, 180);
      return;
    }

    initialized.current = true;
    refreshDiagnostics();

    if (!demoLoaded.current) {
      demoLoaded.current = true;
      window.setTimeout(() => {
        engine.loadTex(DEMO_TEX);
        refreshDiagnostics();
      }, 120);
    }
  }, [clearRetryTimer, containerRef, readyToInit, refreshDiagnostics, viewportRef]);

  useEffect(() => {
    tryInitialize();
    return () => clearRetryTimer();
  }, [tryInitialize, clearRetryTimer]);

  useEffect(() => {
    const container = containerRef.current;
    if (container === null) return;

    const observer = new ResizeObserver(() => {
      if (!initialized.current) {
        tryInitialize();
        return;
      }
      engine.forceLayoutRefresh();
      refreshDiagnostics();
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [containerRef, refreshDiagnostics, tryInitialize]);

  useEffect(() => {
    return () => {
      clearRetryTimer();
      engine.destroy();
      initialized.current = false;
      demoLoaded.current = false;
    };
  }, [clearRetryTimer]);

  const importFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      if (data instanceof ArrayBuffer) {
        demoLoaded.current = true;
        engine.loadFile(data);
        refreshDiagnostics();
      }
    };
    reader.onerror = () => {
      setLastError(`Failed to read file: ${file.name}`);
    };
    reader.readAsArrayBuffer(file);
  }, [refreshDiagnostics]);

  return {
    engine,
    importFile,
    diagnostics,
    initialized: diagnostics.initialized,
    lastError,
  };
}
