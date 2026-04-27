import { useProjectStore } from '../../stores/projectStore';
import { InspectorSection } from '../shared/InspectorSection';
import { TextField } from '../shared/TextField';
import { NumberField } from '../shared/NumberField';
import { SelectField } from '../shared/SelectField';
import { FileText, Music, Settings2 } from 'lucide-react';

const KEY_OPTIONS = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'].map((k) => ({ value: k, label: k }));
const TIME_SIG_OPTIONS = ['4/4','3/4','2/4','6/8','5/4','7/8','12/8'].map((t) => ({ value: t, label: t }));
const DIFFICULTY_OPTIONS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' },
];

export function ProjectInspector() {
  const project = useProjectStore((s) => s.project);
  const update = useProjectStore((s) => s.updateProject);

  return (
    <div>
      <InspectorSection title="Project Info" icon={<FileText size={12} />}>
        <TextField label="Title" value={project.name} onChange={(v) => update({ name: v })} placeholder="Untitled Project" />
        <TextField label="Artist" value={project.artist || ''} onChange={(v) => update({ artist: v })} placeholder="Unknown" />
      </InspectorSection>
      <InspectorSection title="Musical Settings" icon={<Music size={12} />}>
        <NumberField label="BPM" value={project.bpm} min={20} max={300} onChange={(v) => update({ bpm: v })} />
        <SelectField label="Key" value={project.key} options={KEY_OPTIONS} onChange={(v) => update({ key: v })} />
        <SelectField label="Time Sig." value={project.timeSignature} options={TIME_SIG_OPTIONS} onChange={(v) => update({ timeSignature: v })} />
      </InspectorSection>
      <InspectorSection title="Difficulty" icon={<Settings2 size={12} />} defaultOpen={false}>
        <SelectField label="Level" value={project.difficulty || 'intermediate'} options={DIFFICULTY_OPTIONS} onChange={(v) => update({ difficulty: v })} />
      </InspectorSection>
    </div>
  );
}
