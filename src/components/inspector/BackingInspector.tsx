import { InspectorSection } from '../shared/InspectorSection';
import { SelectField } from '../shared/SelectField';
import { NumberField } from '../shared/NumberField';
import { SliderField } from '../shared/SliderField';
import { ToggleField } from '../shared/ToggleField';
import { Wand2, Music, Download } from 'lucide-react';

// Phase 5 — FeatureGated in RightInspector.

export function BackingInspector() {
  return (
    <div>
      <InspectorSection title="AI Band Generator" icon={<Wand2 size={12} />}>
        <SelectField
          label="Key"
          value="C"
          options={['C','D','E','F','G','A','B'].map((k) => ({ value: k, label: k }))}
          onChange={() => {}}
        />
        <SelectField
          label="Style"
          value="rock"
          options={[
            { value: 'rock', label: 'Rock' },
            { value: 'blues', label: 'Blues' },
            { value: 'jazz', label: 'Jazz' },
            { value: 'pop', label: 'Pop' },
            { value: 'funk', label: 'Funk' },
            { value: 'latin', label: 'Latin' },
            { value: 'country', label: 'Country' },
            { value: 'metal', label: 'Metal' },
          ]}
          onChange={() => {}}
        />
        <SelectField
          label="Difficulty"
          value="intermediate"
          options={[
            { value: 'simple', label: 'Simple' },
            { value: 'intermediate', label: 'Intermediate' },
            { value: 'complex', label: 'Complex' },
          ]}
          onChange={() => {}}
        />
        <NumberField label="Measures" value={16} min={4} max={128} onChange={() => {}} />
        <SliderField label="Humanize" value={30} min={0} max={100} unit="%" onChange={() => {}} />
        <SliderField label="Swing" value={0} min={0} max={100} unit="%" onChange={() => {}} />
        <button className="w-full mt-2 h-8 rounded bg-blue-600 hover:bg-blue-500 text-white text-[12px] font-medium transition-colors">
          Generate Band
        </button>
      </InspectorSection>

      <InspectorSection title="Playback" icon={<Music size={12} />} defaultOpen={false}>
        <NumberField label="BPM Override" value={120} min={20} max={300} onChange={() => {}} />
        <SelectField
          label="Key Change"
          value="original"
          options={[
            { value: 'original', label: 'Original' },
            ...['C','D','E','F','G','A','B'].map((k) => ({ value: k, label: k })),
          ]}
          onChange={() => {}}
        />
      </InspectorSection>

      <InspectorSection title="Export" icon={<Download size={12} />} defaultOpen={false}>
        <SelectField
          label="Format"
          value="midi"
          options={[
            { value: 'midi', label: 'MIDI (.mid)' },
            { value: 'wav', label: 'WAV Audio' },
            { value: 'mp3', label: 'MP3 Audio' },
            { value: 'gp', label: 'Guitar Pro (.gp)' },
          ]}
          onChange={() => {}}
        />
        <button className="w-full mt-2 h-8 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 text-[12px] font-medium transition-colors">
          Export Backing Track
        </button>
      </InspectorSection>
    </div>
  );
}
