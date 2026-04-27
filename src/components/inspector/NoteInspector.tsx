import { useEditorStore } from '@/stores/editorStore';
import { InspectorSection } from '../shared/InspectorSection';
import { PropertyRow } from '../shared/PropertyRow';
import { NumberField } from '../shared/NumberField';
import { SelectField } from '../shared/SelectField';
import { ToggleField } from '../shared/ToggleField';
import { Music2, Sparkles, GitBranch } from 'lucide-react';

const DURATION_OPTIONS = [
  { value: '1', label: 'Whole (1)' },
  { value: '2', label: 'Half (1/2)' },
  { value: '4', label: 'Quarter (1/4)' },
  { value: '8', label: 'Eighth (1/8)' },
  { value: '16', label: 'Sixteenth (1/16)' },
  { value: '32', label: 'Thirty-second (1/32)' },
];

const DYNAMIC_OPTIONS = [
  { value: 'ppp', label: 'ppp' },
  { value: 'pp', label: 'pp' },
  { value: 'p', label: 'p' },
  { value: 'mp', label: 'mp' },
  { value: 'mf', label: 'mf' },
  { value: 'f', label: 'f' },
  { value: 'ff', label: 'ff' },
  { value: 'fff', label: 'fff' },
];

const ACCIDENTAL_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'sharp', label: '♯ Sharp' },
  { value: 'flat', label: '♭ Flat' },
  { value: 'natural', label: '♮ Natural' },
  { value: 'double_sharp', label: '𝄪 Double Sharp' },
  { value: 'double_flat', label: '𝄫 Double Flat' },
];

export function NoteInspector() {
  const selectedNoteId = useEditorStore((s) => s.selectedNoteId);
  const selectedNote = useEditorStore((s) => s.selectedNoteData);
  const updateNote = useEditorStore((s) => s.updateSelectedNote);

  if (selectedNoteId === null || !selectedNote) {
    return (
      <div className="flex items-center justify-center h-32 text-slate-500 text-[12px]">
        No note selected
      </div>
    );
  }

  const n = selectedNote;

  return (
    <div>
      {/* Position */}
      <InspectorSection title="Note Position" icon={<Music2 size={12} />}>
        <PropertyRow label="Measure">
          <span className="text-[12px] text-slate-300 tabular-nums">
            {n.measure ?? '—'}
          </span>
        </PropertyRow>
        <PropertyRow label="Beat">
          <span className="text-[12px] text-slate-300 tabular-nums">
            {n.beat ?? '—'}
          </span>
        </PropertyRow>
        <PropertyRow label="String">
          <span className="text-[12px] text-slate-300 tabular-nums">
            {n.string ?? '—'}
          </span>
        </PropertyRow>
        <NumberField
          label="Fret"
          value={n.fret ?? 0}
          min={0}
          max={24}
          onChange={(v) => updateNote({ fret: v })}
        />
        <NumberField
          label="MIDI #"
          value={n.midiNumber ?? 60}
          min={0}
          max={127}
          onChange={(v) => updateNote({ midiNumber: v })}
        />
      </InspectorSection>

      {/* Duration & Dynamics */}
      <InspectorSection title="Duration & Dynamics" icon={<Sparkles size={12} />}>
        <SelectField
          label="Duration"
          value={String(n.duration ?? '4')}
          options={DURATION_OPTIONS}
          onChange={(v) => updateNote({ duration: Number(v) })}
        />
        <ToggleField
          label="Dotted"
          value={n.dotted ?? false}
          onChange={(v) => updateNote({ dotted: v })}
        />
        <ToggleField
          label="Triplet"
          value={n.triplet ?? false}
          onChange={(v) => updateNote({ triplet: v })}
        />
        <SelectField
          label="Dynamic"
          value={n.dynamic ?? 'mf'}
          options={DYNAMIC_OPTIONS}
          onChange={(v) => updateNote({ dynamic: v })}
        />
        <NumberField
          label="Velocity"
          value={n.velocity ?? 80}
          min={0}
          max={127}
          onChange={(v) => updateNote({ velocity: v })}
        />
        <SelectField
          label="Accidental"
          value={n.accidental ?? 'none'}
          options={ACCIDENTAL_OPTIONS}
          onChange={(v) => updateNote({ accidental: v })}
        />
      </InspectorSection>

      {/* Effects & Articulation */}
      <InspectorSection title="Articulation / Effects" icon={<GitBranch size={12} />} defaultOpen={false}>
        <ToggleField
          label="Hammer-On"
          value={n.hammerOn ?? false}
          onChange={(v) => updateNote({ hammerOn: v })}
        />
        <ToggleField
          label="Pull-Off"
          value={n.pullOff ?? false}
          onChange={(v) => updateNote({ pullOff: v })}
        />
        <ToggleField
          label="Slide"
          value={n.slide ?? false}
          onChange={(v) => updateNote({ slide: v })}
        />
        <ToggleField
          label="Bend"
          value={n.bend ?? false}
          onChange={(v) => updateNote({ bend: v })}
        />
        <ToggleField
          label="Vibrato"
          value={n.vibrato ?? false}
          onChange={(v) => updateNote({ vibrato: v })}
        />
        <ToggleField
          label="Harmonic"
          value={n.harmonic ?? false}
          onChange={(v) => updateNote({ harmonic: v })}
        />
        <ToggleField
          label="Palm Mute"
          value={n.palmMute ?? false}
          onChange={(v) => updateNote({ palmMute: v })}
        />
        <ToggleField
          label="Let Ring"
          value={n.letRing ?? false}
          onChange={(v) => updateNote({ letRing: v })}
        />
        <ToggleField
          label="Ghost Note"
          value={n.ghost ?? false}
          onChange={(v) => updateNote({ ghost: v })}
        />
        <ToggleField
          label="Accent"
          value={n.accent ?? false}
          onChange={(v) => updateNote({ accent: v })}
        />
        <ToggleField
          label="Staccato"
          value={n.staccato ?? false}
          onChange={(v) => updateNote({ staccato: v })}
        />
      </InspectorSection>
    </div>
  );
}