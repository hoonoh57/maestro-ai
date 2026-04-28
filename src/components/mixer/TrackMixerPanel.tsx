import React from 'react';
import { SlidersHorizontal, Volume2 } from 'lucide-react';
import { engine } from '../../core/AlphaTabEngine';
import { useProjectStore } from '../../stores/projectStore';
import type { TrackRole } from '../../types/project';

const ROLE_OPTIONS: { value: TrackRole; label: string }[] = [
  { value: 'melody', label: 'Melody' },
  { value: 'guitar', label: 'Guitar' },
  { value: 'bass', label: 'Bass' },
  { value: 'drums', label: 'Drums' },
  { value: 'keys', label: 'Keys' },
  { value: 'strings', label: 'Strings' },
  { value: 'vocal', label: 'Vocal' },
  { value: 'other', label: 'Other' },
];

function clampVolume(value: number): number {
  if (!Number.isFinite(value)) return 80;
  if (value < 0) return 0;
  if (value > 127) return 127;
  return Math.round(value);
}

function getAlphaTabTrack(index: number) {
  const score = engine.score;
  if (!score || !score.tracks[index]) return null;
  return score.tracks[index];
}

export function TrackMixerPanel() {
  const tracks = useProjectStore((s) => s.project.tracks);
  const updateTrack = useProjectStore((s) => s.updateTrack);
  const setTrackMute = useProjectStore((s) => s.setTrackMute);
  const setTrackSolo = useProjectStore((s) => s.setTrackSolo);
  const setTrackVolume = useProjectStore((s) => s.setTrackVolume);

  const updateVolume = (index: number, id: string, value: number) => {
    const volume = clampVolume(value);
    setTrackVolume(id, volume);
    const atTrack = getAlphaTabTrack(index);
    if (atTrack) engine.changeTrackVolume([atTrack], volume / 100);
  };

  const updateMute = (index: number, id: string, value: boolean) => {
    setTrackMute(id, value);
    const atTrack = getAlphaTabTrack(index);
    if (atTrack) engine.changeTrackMute([atTrack], value);
  };

  const updateSolo = (index: number, id: string, value: boolean) => {
    setTrackSolo(id, value);
    const atTrack = getAlphaTabTrack(index);
    if (atTrack) engine.changeTrackSolo([atTrack], value);
  };

  return (
    <div className="absolute inset-0 z-20 bg-[#0f172a]/95 text-slate-200 overflow-auto">
      <div className="p-5 border-b border-slate-700/70 flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center">
          <SlidersHorizontal className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Track Mixer</h2>
          <p className="text-xs text-slate-500">Normalize imported GP tracks, balance playback, and control mute/solo/volume per track.</p>
        </div>
      </div>

      {tracks.length === 0 ? (
        <div className="p-8 text-sm text-slate-500">No tracks loaded. Import a Guitar Pro or MusicXML score first.</div>
      ) : (
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {tracks.map((track, index) => (
            <div key={track.id} className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4 shadow-xl">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: track.color }} />
                    <h3 className="text-sm font-semibold text-white truncate max-w-[180px]">{track.name}</h3>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">#{index + 1} · {track.instrument}</div>
                </div>
                {track.normalized && (
                  <span className="text-[10px] rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5">normalized</span>
                )}
              </div>

              <label className="block text-[11px] text-slate-500 mb-1">Role</label>
              <select
                value={track.role ?? 'other'}
                onChange={(e) => updateTrack(index, { role: e.target.value as TrackRole })}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2 py-1.5 text-xs text-slate-100 mb-3"
              >
                {ROLE_OPTIONS.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
              </select>

              <div className="mb-3">
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                  <span className="flex items-center gap-1"><Volume2 className="w-3 h-3" /> Volume</span>
                  <span>{track.volume}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={127}
                  value={track.volume}
                  onChange={(e) => updateVolume(index, track.id, Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                  <span>Pan</span>
                  <span>{Math.round(track.pan)}</span>
                </div>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  value={Math.round(track.pan)}
                  onChange={(e) => updateTrack(index, { pan: Number(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => updateMute(index, track.id, !track.mute)}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold border transition ${track.mute ? 'bg-orange-600 border-orange-400 text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'}`}
                >
                  Mute
                </button>
                <button
                  onClick={() => updateSolo(index, track.id, !track.solo)}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold border transition ${track.solo ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'}`}
                >
                  Solo
                </button>
              </div>

              {track.normalizationNotes && track.normalizationNotes.length > 0 && (
                <div className="mt-3 rounded-lg bg-slate-900 border border-slate-800 px-2 py-2">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Import notes</div>
                  {track.normalizationNotes.map((note, noteIndex) => (
                    <div key={noteIndex} className="text-[11px] text-slate-400 leading-relaxed">• {note}</div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
