type UndoAction = {
  description: string;
  undo: () => void;
  redo: () => void;
};

class UndoManager {
  private undoStack: UndoAction[] = [];
  private redoStack: UndoAction[] = [];
  private maxSize = 100;
  private listeners: Set<() => void> = new Set();

  push(action: UndoAction) {
    this.undoStack.push(action);
    if (this.undoStack.length > this.maxSize) {
      this.undoStack.shift();
    }
    this.redoStack = [];
    this.notify();
  }

  undo() {
    const action = this.undoStack.pop();
    if (!action) return;
    action.undo();
    this.redoStack.push(action);
    this.notify();
  }

  redo() {
    const action = this.redoStack.pop();
    if (!action) return;
    action.redo();
    this.undoStack.push(action);
    this.notify();
  }

  get canUndo() { return this.undoStack.length > 0; }
  get canRedo() { return this.redoStack.length > 0; }
  get undoDescription() {
    if (this.undoStack.length === 0) return '';
    return this.undoStack[this.undoStack.length - 1].description;
  }
  get redoDescription() {
    if (this.redoStack.length === 0) return '';
    return this.redoStack[this.redoStack.length - 1].description;
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.notify();
  }
}

export const undoManager = new UndoManager();