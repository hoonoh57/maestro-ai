import React, { useMemo, useState } from 'react';
import { Gauge, RefreshCw } from 'lucide-react';
import { InspectorSection } from '../shared/InspectorSection';
import { SelectField } from '../shared/SelectField';
import { NumberField } from '../shared/NumberField';
import {
  getPlaybackQualityProfile,
  savePlaybackQualityProfile,
  type PlaybackQualityMode,
} from '../../services/playback/PlaybackQualityService';

const QUALITY_OPTIONS = [
  { value: 'balanced', label: 'Balanced' },
  { value: 'studio', label: 'Studio' },
];

const SOUNDFONT_OPTIONS = [
  { value: '/soundfont/sonivox.sf2', label: 'Sonivox GM - bundled' },
  { value: '/soundfont/FluidR3_GM.sf2', label: 'FluidR3 GM - high quality' },
  { value: '/soundfont/MuseScore_General.sf2', label: 'MuseScore General - external' },
  { value: '/soundfont/Arachno.sf2', label: 'Arachno GM - external' },
  { value: '/soundfont/Timbres_Of_Heaven.sf2', label: 'Timbres of Heaven - external' },
];

function normalizeSoundFontUrl(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) return '/soundfont/FluidR3_GM.sf2';
  if (trimmed.startsWith('/')) return trimmed;
  if (trimmed.toLowerCase().startsWith('http://') || trimmed.toLowerCase().startsWith('https://')) return trimmed;
  return `/soundfont/${trimmed}`;
}

export function PlaybackQualityPanel() {
  const [profile, setProfile] = useState(() => getPlaybackQualityProfile());
  const [customSoundFont, setCustomSoundFont] = useState(profile.soundFontUrl);

  const hint = useMemo(() => {
    if (profile.mode === 'studio') return 'Higher buffer and safer playback for imported GP files.';
    return 'Lower latency profile for lighter scores.';
  }, [profile.mode]);

  const updateProfile = (patch: Partial<typeof profile>) => {
    const next = savePlaybackQualityProfile(patch);
    setProfile(next);
    if (typeof patch.soundFontUrl === 'string') setCustomSoundFont(patch.soundFontUrl);
  };

  const applyCustomSoundFont = () => {
    const nextUrl = normalizeSoundFontUrl(customSoundFont);
    updateProfile({ soundFontUrl: nextUrl });
  };

  return (
    <InspectorSection title="Playback Quality" icon={<Gauge size={12} />} defaultOpen={false}>
      <SelectField
        label="Mode"
        value={profile.mode}
        options={QUALITY_OPTIONS}
        onChange={(v) => updateProfile({ mode: v as PlaybackQualityMode })}
      />
      <SelectField
        label="SoundFont"
        value={profile.soundFontUrl}
        options={SOUNDFONT_OPTIONS}
        onChange={(v) => updateProfile({ soundFontUrl: v })}
      />
      <div className="px-3 pb-2">
        <label className="block text-[11px] text-slate-500 mb-1">External SoundFont URL / file name</label>
        <input
          value={customSoundFont}
          onChange={(e) => setCustomSoundFont(e.target.value)}
          placeholder="/soundfont/MyHighQuality.sf2"
          className="w-full h-8 rounded bg-slate-900 border border-slate-700 px-2 text-[11px] text-slate-200 outline-none focus:border-blue-500"
        />
        <button
          onClick={applyCustomSoundFont}
          className="mt-2 h-7 rounded bg-slate-800 hover:bg-slate-700 px-2.5 text-[11px] text-slate-200"
        >
          Use this SoundFont
        </button>
      </div>
      <NumberField
        label="Buffer ms"
        value={profile.bufferTimeInMilliseconds}
        min={300}
        max={3000}
        onChange={(v) => updateProfile({ bufferTimeInMilliseconds: v })}
      />
      <NumberField
        label="Min Track Vol"
        value={Math.round(profile.minTrackVolume * 100)}
        min={0}
        max={100}
        onChange={(v) => updateProfile({ minTrackVolume: v / 100 })}
      />
      <div className="px-3 pb-2 text-[11px] text-slate-500 leading-relaxed">
        {hint}<br />
        External SF2/SF3 files should be placed under <span className="text-slate-300">public/soundfont</span> or served by a trusted local library server.
      </div>
      <button
        onClick={() => window.location.reload()}
        className="mx-3 mb-3 flex items-center gap-1.5 rounded bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 text-xs text-slate-200 transition"
      >
        <RefreshCw className="w-3 h-3" /> Apply / Reload
      </button>
    </InspectorSection>
  );
}
