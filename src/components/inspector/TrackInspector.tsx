import { useEditorStore } from '@/stores/editorStore';
import { useProjectStore } from '@/stores/projectStore';
import { InspectorSection } from '../shared/InspectorSection';
import { TextField } from '../shared/TextField';
import { SliderField } from '../shared/SliderField';
import { SelectField } from '../shared/SelectField';
import { ToggleField } from '../shared/ToggleField';
import { NumberField } from '../shared/NumberField';
import { ColorDot } from '../shared/ColorDot';
import { PropertyRow } from '../shared/PropertyRow';
import { PlaybackQualityPanel } from '../playback/PlaybackQualityPanel';
import { Layers, Volume2, Palette } from 'lucide-react';

const INSTRUMENT_OPTIONS = [
  { value: 'acoustic_guitar', label: 'Acoustic Guitar' },
  { value: 'electric_guitar', label: 'Electric Guitar' },
  { value: 'bass', label: 'Bass Guitar' },
  { value: 'piano', label: 'Piano' },
  { value: 'drums', label: 'Drums' },
  { value: 'violin', label: 'Violin' },
  { value: 'vocals', label: 'Vocals' },
  { value: 'synth', label: 'Synthesizer' },
  { value: 'ukulele', label: 'Ukulele' },
  { value: 'other', label: 'Other' },
];

const CLEF_OPTIONS = [
  { value: 'treble', label: 'Treble (G)' },
  { value: 'bass', label: 'Bass (F)' },
  { value: 'tab', label: 'Tablature' },
  { value: 'percussion', label: 'Percussion' },
];

const TRACK_COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f97316', '#facc15',
  '#a855f7', '#ec4899', '#14b8a6', '#6366f1', '#78716c',
];

export function TrackInspector() {
  const selectedTrackIndex = useEditorStore((s) => s.selectedTrackIndex);
  const tracks = useProjectStore((s) => s.project.tracks);
  const updateTrack = useProjectStore((s) => s.updateTrack);

  if (selectedTrackIndex === null || !tracks[selectedTrackIndex]) {
    return (
      <div>
        <div className="flex items-center justify-center h-32 text-slate-500 text-[12px]">
          No track selected
        </div>
        <PlaybackQualityPanel />
      </div>
    );
  }

  const track = tracks[selectedTrackIndex];
  const idx = selectedTrackIndex;

  const set = (patch: Record<string, unknown>) => updateTrack(idx, patch);

  return (
    <div>
      {/* Identity */}
      <InspectorSection title="Track Identity" icon={<Layers size={12} />} badge={idx + 1}>
        <TextField
          label="Name"
          value={track.name}
          onChange={(v) => set({ name: v })}
          placeholder="Untitled Track"
        />
        <SelectField
          label="Instrument"
          value={track.instrument}
          options={INSTRUMENT_OPTIONS}
          onChange={(v) => set({ instrument: v })}
        />
        <SelectField
          label="Clef"
          value={track.clef || 'treble'}
          options={CLEF_OPTIONS}
          onChange={(v) => set({ clef: v })}
        />
        <PropertyRow label="Color">
          <div className="flex gap-1.5 flex-wrap">
            {TRACK_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => set({ color: c })}
                className={`p-0.5 rounded-full border transition-colors ${
                  track.color === c
                    ? 'border-white'
                    : 'border-transparent hover:border-slate-500'
                }`}
              >
                <ColorDot color={c} size={14} />
              </button>
            ))}
          </div>
        </PropertyRow>
      </InspectorSection>

      {/* Audio */}
      <InspectorSection title="Audio" icon={<Volume2 size={12} />}>
        <SliderField
          label="Volume"
          value={track.volume ?? 100}
          min={0}
          max={127}
          onChange={(v) => set({ volume: v })}
        />
        <SliderField
          label="Pan"
          value={track.pan ?? 64}
          min={0}
          max={127}
          unit=""
          onChange={(v) => set({ pan: v })}
        />
        <ToggleField
          label="Mute"
          value={track.mute ?? false}
          onChange={(v) => set({ mute: v })}
        />
        <ToggleField
          label="Solo"
          value={track.solo ?? false}
          onChange={(v) => set({ solo: v })}
        />
      </InspectorSection>

      <PlaybackQualityPanel />

      {/* Display */}
      <InspectorSection title="Display" icon={<Palette size={12} />} defaultOpen={false}>
        <NumberField
          label="Capo Fret"
          value={track.capo ?? 0}
          min={0}
          max={12}
          onChange={(v) => set({ capo: v })}
        />
        <SelectField
          label="Tuning"
          value={track.tuning || 'standard'}
          options={[
            { value: 'standard', label: 'Standard (EADGBE)' },
            { value: 'drop_d', label: 'Drop D (DADGBE)' },
            { value: 'open_g', label: 'Open G (DGDGBD)' },
            { value: 'dadgad', label: 'DADGAD' },
            { value: 'half_step_down', label: 'Half Step Down' },
            { value: 'custom', label: 'Custom' },
          ]}
          onChange={(v) => set({ tuning: v })}
        />
        <NumberField
          label="Strings"
          value={track.strings ?? 6}
          min={4}
          max={12}
          onChange={(v) => set({ strings: v })}
        />
      </InspectorSection>
    </div>
  );
}
