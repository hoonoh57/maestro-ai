import React, { useCallback } from 'react';
import { Music4, Save, FolderOpen, Download, Upload } from 'lucide-react';
import { useUIStore, type AppMode } from '../../stores/uiStore';
import { useProjectStore } from '../../stores/projectStore';
import { useFileOperations } from '../../hooks/useFileOperations';

const MODES: { id: AppMode; label: string }[] = [
  { id: 'editor', label: 'Editor' },
  { id: 'practice', label: 'Practice' },
  { id: 'backing', label: 'Backing' },
  { id: 'busking', label: 'Busking' },
  { id: 'mixer', label: 'Mixer' },
  { id: 'test', label: 'Test' },
];

export function AppBar() {
  const mode = useUIStore((s) => s.mode);
  const setMode = useUIStore((s) => s.setMode);
  const projectName = useProjectStore((s) => s.project.name);
  const setProjectName = useProjectStore((s) => s.setProjectName);
  const isDirty = useProjectStore((s) => s.isDirty);

  const {
    handleSave,
    handleLoad,
    handleExportMidi,
    handleImport,
  } = useFileOperations();

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setProjectName(e.target.value);
    },
    [setProjectName]
  );

  const iconBtn =
    'flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11px] text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors';

  return (
    <header className="h-10 bg-[#0f172a] border-b border-slate-700/60 flex items-center px-3 gap-2 select-none shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-2">
        <Music4 size={18} className="text-blue-500" />
        <span className="text-[13px] font-bold text-slate-200 tracking-tight">
          MaestroAI
        </span>
      </div>

      {/* Project name */}
      <input
        type="text"
        value={projectName}
        onChange={handleNameChange}
        className="h-7 w-40 px-2 text-[12px] bg-slate-800/60 border border-slate-700/50 rounded text-slate-300 focus:border-blue-500 focus:outline-none"
      />

      {/* Dirty indicator */}
      {isDirty && <span className="w-2 h-2 rounded-full bg-orange-500" title="Unsaved" />}

      {/* Mode Tabs */}
      <nav className="flex items-center gap-0.5 ml-3">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`
              px-3 py-1.5 rounded text-[11px] font-medium transition-colors
              ${mode === m.id
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/40'}
            `}
          >
            {m.label}
          </button>
        ))}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* File Operations */}
      <button onClick={handleSave} className={iconBtn} title="Save (Ctrl+S)">
        <Save size={14} /> Save
      </button>
      <button onClick={handleLoad} className={iconBtn} title="Load">
        <FolderOpen size={14} /> Load
      </button>
      <button onClick={handleExportMidi} className={iconBtn} title="Export MIDI">
        <Download size={14} /> Export
      </button>
      <button onClick={handleImport} className={iconBtn} title="Import File">
        <Upload size={14} /> Import
      </button>
    </header>
  );
}