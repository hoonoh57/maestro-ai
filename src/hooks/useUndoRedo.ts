import { useEffect, useState } from 'react';
import { undoManager } from '@/core/UndoManager';

export function useUndoRedo() {
  const [state, setState] = useState({
    canUndo: false,
    canRedo: false,
    undoDesc: '',
    redoDesc: '',
  });

  useEffect(() => {
    const unsubscribe = undoManager.subscribe(() => {
      setState({
        canUndo: undoManager.canUndo,
        canRedo: undoManager.canRedo,
        undoDesc: undoManager.undoDescription,
        redoDesc: undoManager.redoDescription,
      });
    });

    return unsubscribe;
  }, []);

  return {
    canUndo: state.canUndo,
    canRedo: state.canRedo,
    undoDescription: state.undoDesc,
    redoDescription: state.redoDesc,
    undo: () => undoManager.undo(),
    redo: () => undoManager.redo(),
  };
}