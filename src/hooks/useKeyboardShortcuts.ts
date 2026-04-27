import { useEffect } from 'react';
import { engine } from '@/core/AlphaTabEngine';
import { undoManager } from '@/core/UndoManager';
import { useEditorStore } from '@/stores/editorStore';
import { useProjectStore } from '@/stores/projectStore';
import type { NoteDuration } from '@/types/project';

export function useKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;

      // Playback
      if (e.code === 'Space' && !ctrl) {
        e.preventDefault();
        engine.playPause();
        return;
      }

      // Undo/Redo
      if (ctrl && e.code === 'KeyZ' && !e.shiftKey) {
        e.preventDefault();
        undoManager.undo();
        return;
      }
      if (ctrl && e.code === 'KeyZ' && e.shiftKey) {
        e.preventDefault();
        undoManager.redo();
        return;
      }
      if (ctrl && e.code === 'KeyY') {
        e.preventDefault();
        undoManager.redo();
        return;
      }

      // Save
      if (ctrl && e.code === 'KeyS') {
        e.preventDefault();
        useProjectStore.getState().saveToLocal();
        return;
      }

      // Delete selected note
      if (e.code === 'Delete' || e.code === 'Backspace') {
        const sel = useEditorStore.getState().selectedNote;
        if (sel) {
          e.preventDefault();
          // Note deletion 로직은 ScoreCanvas에서 처리
          document.dispatchEvent(new CustomEvent('maestro:deleteNote'));
        }
        return;
      }

      // Tool shortcuts
      if (!ctrl) {
        const toolMap: Record<string, () => void> = {
          'KeyV': () => useEditorStore.getState().setTool('select'),
          'KeyN': () => useEditorStore.getState().setTool('draw'),
          'KeyE': () => useEditorStore.getState().setTool('erase'),
          'KeyM': () => useEditorStore.getState().setTool('move'),
        };
        if (toolMap[e.code]) {
          e.preventDefault();
          toolMap[e.code]();
          return;
        }

        // Duration shortcuts (1-5)
        const durMap: Record<string, NoteDuration> = {
          'Digit1': 'whole',
          'Digit2': 'half',
          'Digit3': 'quarter',
          'Digit4': 'eighth',
          'Digit5': 'sixteenth',
        };
        if (durMap[e.code]) {
          e.preventDefault();
          useEditorStore.getState().setDuration(durMap[e.code]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}