import React from 'react';
import { useEditorStore } from '@/stores/editorStore';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { engine } from '@/core/AlphaTabEngine';
import { IconButton } from '@/components/shared/IconButton';
import { Slider } from '@/components/shared/Slider';
import { MousePointer, Pencil, Eraser, Move, Scissors, Plus, Trash2, Copy, Volume2, VolumeX, Headphones, ChevronDown, ChevronRight } from 'lucide-react';
import type { NoteDuration, InsertTool } from '@/types/project';

const DURATIONS: { key: NoteDuration; label: string; symbol: string }[] = [
  { key: 'whole', label: 'Whole', symbol: '𝄝' },
  { key: 'half', label: 'Half', symbol: '𝄗𝄥' },
  { key: 'quarter', label: 'Quarter', symbol: '♪' },
  { key: 'eighth', label: 'Eighth', symbol: '♫' },
  { key: 'sixteenth', label: '16th', symbol: '𝄘𝄥𝄯' },
];

const TOOLS: { key: InsertTool; label: string; icon: React.ReactNode; shortcut: string }[] = [
  { key: 'select', label: 'Select', icon: <MousePointer className="w-4 h-4" />, shortcut: 'V' },
  { key: 'draw', label: 'Draw', icon: <Pencil className="w-4 h-4" />, shortcut: 'N' },
  { key: 'erase', label: 'Erase', icon: <Eraser className="w-4 h-4" />, shortcut: 'E' },
  { key: 'move', label: 'Move', icon: <Move className="w-4 h-4" />, shortcut: 'M' },
];

export function LeftSidebar() {
  const mode = useUIStore((s) => s.mode);
  const selectedTool = useEditorStore((s) => s.selectedTool);
  const setTool = useEditorStore((s) => s.setTool);
  const selectedDuration = useEditorStore((s) => s.selectedDuration);
  const setDuration = useEditorStore((s) => s.setDuration);
  const tracks = useProjectStore((s) => s.project.tracks);
  const setTrackMute = useProjectStore((s) => s.setTrackMute);
  const setTrackSolo = useProjectStore((s) => s.setTrackSolo);
  const setTrackVolume = useProjectStore((s) => s.setTrackVolume);
  const addTrack = useProjectStore((s) => s.addTrack);
  const removeTrack = useProjectStore((s) => s.removeTrack);
  const duplicateTrack = useProjectStore((s) => s.duplicateTrack);
  const selectedTrackIndex = useEditorStore((s) => s.selectedTrackIndex);
  const setSelectedTrackIndex = useEditorStore((s) => s.setSelectedTrackIndex);

  const isEditor = mode === 'editor';

  return (
    <div className="w-[210px] bg-daw-panel border-r border-daw-grid flex flex-col shrink-0 overflow-y-auto">
      {/* Note Palette — Editor only */}
      {isEditor && (
        <div className="p-3 border-b border-daw-grid">
          <h3 className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Note Palette</h3>
          <div className="grid grid-cols-3 gap-1">
            {DURATIONS.map((d) => (
              <button
                key={d.key}
                onClick={() => setDuration(d.key)}
                className={`py-1.5 rounded text-center transition text-lg
                  ${selectedDuration === d.key
                    ? 'bg-daw-accent text-white'
                    : 'bg-daw-bg text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                title={d.label}
              >
                {d.symbol}
              </button>
            ))}
            <button className="py-1.5 rounded bg-daw-bg text-slate-400 hover:text-white hover:bg-slate-700 text-sm" title="Rest">
              𝄎
            </button>
          </div>
        </div>
      )}

      {/* Insert Tools — Editor only */}
      {isEditor && (
        <div className="p-3 border-b border-daw-grid">
          <h3 className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Tools</h3>
          <div className="flex flex-col gap-0.5">
            {TOOLS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTool(t.key)}
                className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm transition
                  ${selectedTool === t.key
                    ? 'bg-daw-accent text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
              >
                {t.icon}
                <span className="flex-1 text-left">{t.label}</span>
                <span className="text-[10px] text-slate-500">{t.shortcut}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Track List */}
      <div className="p-3 flex-1">
        <h3 className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Tracks</h3>
        <div className="flex flex-col gap-1.5">
          {tracks.map((track, i) => (
            <div
              key={track.id}
              onClick={() => {
                setSelectedTrackIndex(i);
                // alphaTab에서 해당 트랙만 렌더
                const score = engine.score;
                if (score && score.tracks[i]) {
                  // 트랙 선택 시 하이라이트만 (전체 트랙 유지)
                }
              }}
              className={`rounded-lg p-2 transition cursor-pointer
                ${selectedTrackIndex === i ? 'bg-slate-700/50 ring-1 ring-daw-accent/50' : 'hover:bg-slate-800'}`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: track.color }} />
                <span className="text-xs text-white font-medium truncate flex-1">{track.name}</span>
              </div>
              <div className="flex items-center gap-1 mb-1">
                <button
                  onClick={(e) => { e.stopPropagation(); setTrackMute(track.id, !track.mute); 
                    const score = engine.score;
                    if (score?.tracks[i]) engine.changeTrackMute([score.tracks[i]], !track.mute);
                  }}
                  className={`text-[10px] font-bold w-6 h-5 rounded transition
                    ${track.mute ? 'bg-daw-warning text-white' : 'bg-daw-bg text-slate-500 hover:text-white'}`}
                  title="Mute"
                >M</button>
                <button
                  onClick={(e) => { e.stopPropagation(); setTrackSolo(track.id, !track.solo);
                    const score = engine.score;
                    if (score?.tracks[i]) engine.changeTrackSolo([score.tracks[i]], !track.solo);
                  }}
                  className={`text-[10px] font-bold w-6 h-5 rounded transition
                    ${track.solo ? 'bg-daw-selected text-black' : 'bg-daw-bg text-slate-500 hover:text-white'}`}
                  title="Solo"
                >S</button>
                <div className="flex-1 ml-1">
                  <Slider
                    value={track.volume}
                    onChange={(v) => { 
                      setTrackVolume(track.id, v);
                      const score = engine.score;
                      if (score?.tracks[i]) engine.changeTrackVolume([score.tracks[i]], v / 100);
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add/Manage Track Buttons */}
        {isEditor && (
          <div className="flex gap-1 mt-3">
            <button
              onClick={() => addTrack(`Track ${tracks.length + 1}`, 'Piano')}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-daw-accent transition px-2 py-1 rounded hover:bg-slate-800"
            >
              <Plus className="w-3 h-3" /> Add Track
            </button>
          </div>
        )}
      </div>
    </div>
  );
}