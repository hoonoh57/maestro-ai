import { useCallback } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { engine } from '@/core/AlphaTabEngine';

export function useFileOperations() {
  const projectName = useProjectStore((s) => s.project.name);

  // ── Save to localStorage ──────────────────
  const handleSave = useCallback(() => {
    const state = useProjectStore.getState();
    const json = JSON.stringify(state.project);
    localStorage.setItem(`maestro_project_${state.project.id}`, json);
    localStorage.setItem('maestro_last_project_id', state.project.id);
    state.markClean();
    console.log('[Save] Project saved to localStorage');
    return json;
  }, []);

  // ── Load from localStorage ────────────────
  const handleLoad = useCallback(() => {
    const state = useProjectStore.getState();
    state.loadFromLocal();
    console.log('[Load] Project loaded from localStorage');
  }, []);

  // ── Export MIDI ───────────────────────────
  const handleExportMidi = useCallback(() => {
    engine.downloadMidi();
    console.log('[Export] MIDI exported');
  }, []);

  // ── Export project JSON ───────────────────
  const handleExportJson = useCallback(() => {
    const state = useProjectStore.getState();
    const json = JSON.stringify(state.project, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName || 'project'}.maestro.json`;
    a.click();
    URL.revokeObjectURL(url);
    console.log('[Export] JSON exported');
  }, [projectName]);

  // ── Import file (.gp, .gp3-8, .gpx, .musicxml) ──
  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.gp,.gp3,.gp4,.gp5,.gpx,.gp7,.gp8,.musicxml,.xml,.maestro.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      if (file.name.endsWith('.maestro.json')) {
        // Load project JSON
        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const data = JSON.parse(ev.target?.result as string);
            useProjectStore.getState().setProject(data);
            console.log('[Import] Project loaded');
          } catch (err) {
            console.error('[Import] Invalid project file', err);
          }
        };
        reader.readAsText(file);
      } else {
        // Load music file via alphaTab
        const reader = new FileReader();
        reader.onload = (ev) => {
          const data = ev.target?.result;
          if (data instanceof ArrayBuffer) {
            engine.loadFile(data);
            console.log('[Import] Score loaded');
          }
        };
        reader.readAsArrayBuffer(file);
      }
    };
    input.click();
  }, []);

  return {
    handleSave,
    handleLoad,
    handleExportMidi,
    handleExportJson,
    handleImport,
  };
}
