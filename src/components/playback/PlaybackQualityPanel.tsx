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
];

export function PlaybackQualityPanel() {
  const [profile, setProfile] = useState(() => getPlaybackQualityProfile());

  const hint = useMemo(() => {
    if (profile.mode === 'studio') return 'Higher buffer and safer playback for imported GP files.';
    return 'Lower latency profile for lighter scores.';
  }, [profile.mode]);

  const updateProfile = (patch: Partial<typeof profile>) => {
    const next = savePlaybackQualityProfile(patch);
    setProfile(next);
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
        Reload the page after changing SoundFont or buffer profile.
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
