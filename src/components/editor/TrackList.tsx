import React, { useCallback } from 'react';
import { Plus, Copy, Trash2 } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { useEditorStore } from '@/stores/editorStore';
import { engine } from '@/core/AlphaTabEngine';
import { ColorDot } from '@/components/shared/ColorDot';

function TrackItem({ trackId, index }: { trackId: string; index: number }) {
  const tracks = useProjectStore((s) => s.project.tracks);
  const track = tracks.find(t => t.id === trackId);
  
  if (!track) return null;

  const setTrackMute = useProjectStore((s) => s.setTrackMute);
  const setTrackSolo = useProjectStore((s) => s.setTrackSolo);
  const setTrackVolume = useProjectStore((s) => s.setTrackVolume);
  const selectedTrackIndex = useEditorStore((s) => s.selectedTrackIndex);
  const selectTrack = useEditorStore((s) => s.setSelectedTrackIndex);

  const isSelected = selectedTrackIndex === index;

  const getAlphaTabTrack = useCallback(() => {
    const score = engine.score;
    if (!score || track.atTrackIndex === undefined) return null;
    return score.tracks[track.atTrackIndex] ?? null;
  }, [track.atTrackIndex]);

  const handleMuteToggle = useCallback(() => {
    const atTrack = getAlphaTabTrack();
    const newMute = !track.mute;
    setTrackMute(trackId, newMute);
    if (atTrack) {
      engine.changeTrackMute([atTrack], newMute);
    }
  }, [getAlphaTabTrack, trackId, track.mute, setTrackMute]);

  const handleSoloToggle = useCallback(() => {
    const atTrack = getAlphaTabTrack();
    const newSolo = !track.solo;
    setTrackSolo(trackId, newSolo);
    if (atTrack) {
      engine.changeTrackSolo([atTrack], newSolo);
    }
  }, [getAlphaTabTrack, trackId, track.solo, setTrackSolo]);

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const vol = Number(e.target.value);
      setTrackVolume(trackId, vol);
      const atTrack = getAlphaTabTrack();
      if (atTrack) {
        // alphaTab volume 0-16
        engine.changeTrackVolume([atTrack], (vol / 100) * 16);
      }
    },
    [getAlphaTabTrack, trackId, setTrackVolume]
  );

  return (
    <div
      className={`
        px-2 py-2 border-b border-slate-700/40 cursor-pointer transition-colors
        ${isSelected ? 'bg-slate-800/60' : 'hover:bg-slate-800/30'}
      `}
      onClick={() => selectTrack(index)}
    >
      {/* Track name row */}
      <div className="flex items-center gap-2 mb-1.5">
        <ColorDot color={track.color} size={8} />
        <span className="text-[12px] text-slate-200 flex-1 truncate">
          {track.name}
        </span>
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={(e) => { e.stopPropagation(); handleMuteToggle(); }}
          className={`
            w-6 h-5 text-[10px] font-bold rounded
            ${track.mute
              ? 'bg-red-600/30 text-red-400'
              : 'bg-slate-700/50 text-slate-500 hover:text-slate-300'}
          `}
        >
          M
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); handleSoloToggle(); }}
          className={`
            w-6 h-5 text-[10px] font-bold rounded
            ${track.solo
              ? 'bg-yellow-600/30 text-yellow-400'
              : 'bg-slate-700/50 text-slate-500 hover:text-slate-300'}
          `}
        >
          S
        </button>
        <input
          type="range"
          min={0}
          max={100}
          value={track.volume}
          onChange={handleVolumeChange}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 h-1 accent-blue-500 cursor-pointer"
        />
        <span className="text-[10px] text-slate-500 w-5 text-right tabular-nums">
          {track.volume}
        </span>
      </div>
    </div>
  );
}

export function TrackList() {
  const tracks = useProjectStore((s) => s.project.tracks);
  const addTrack = useProjectStore((s) => s.addTrack);

  const handleAddTrack = useCallback(() => {
    const COLORS = [
      '#3b82f6','#22c55e','#ef4444','#f97316','#facc15',
      '#a855f7','#ec4899','#14b8a6',
    ];
    addTrack(
      `Track ${tracks.length + 1}`,
      'acoustic_guitar'
    );
  }, [addTrack, tracks.length]);

  return (
    <div>
      <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        Tracks
      </div>
      {tracks.map((t, i) => (
        <TrackItem key={t.id} trackId={t.id} index={i} />
      ))}
      <button
        onClick={handleAddTrack}
        className="w-full px-3 py-2 text-[11px] text-slate-500 hover:text-blue-400 hover:bg-slate-800/40 transition-colors flex items-center gap-1.5"
      >
        <Plus size={12} /> Add Track
      </button>
    </div>
  );
}