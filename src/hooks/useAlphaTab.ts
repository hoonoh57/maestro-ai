// ─────────────────────────────────────────────────
// src/hooks/useAlphaTab.ts
// alphaTab 초기화 — 컨테이너가 visible일 때만 실행
// ─────────────────────────────────────────────────

import { useEffect, useRef, useCallback } from 'react';
import { engine } from '../core/AlphaTabEngine';
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

// 더미 ref (null 방어용)
const nullRef = { current: null };

export function useAlphaTab(
  containerRef: React.RefObject<HTMLElement | null>,
  viewportRef: React.RefObject<HTMLElement | null>
) {
  const initialized = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    const scroll = viewportRef.current;

    // 둘 중 하나라도 없으면 대기
    if (!el || !scroll) return;
    // 이미 초기화했으면 스킵
    if (initialized.current) return;

    // 크기 한번 더 확인
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      console.warn('[useAlphaTab] Container has zero size, skipping init');
      return;
    }

    initialized.current = true;

    engine.init(el, scroll, {
      onScoreLoaded: (score) => {
        useProjectStore.getState().syncFromScore(score);
      },
      onPlayerReady: () => {
        useTransportStore.getState().setPlayerReady();
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
      onRenderFinished: () => {},
      onError: (e) => console.error('[alphaTab error]', e),
    });

    // 약간의 딜레이 후 데모 로드 (렌더러 준비 대기)
    const timer = setTimeout(() => {
      engine.loadTex(DEMO_TEX);
    }, 300);

    return () => {
      clearTimeout(timer);
      engine.destroy();
      initialized.current = false;
    };
  }, [containerRef.current, viewportRef.current]); // ref.current 변경 시 재실행

  const importFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      if (data instanceof ArrayBuffer) engine.loadFile(data);
    };
    reader.readAsArrayBuffer(file);
  }, []);

  return { engine, importFile };
}
