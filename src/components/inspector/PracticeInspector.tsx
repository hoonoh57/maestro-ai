import { InspectorSection } from '../shared/InspectorSection';
import { SliderField } from '../shared/SliderField';
import { NumberField } from '../shared/NumberField';
import { ToggleField } from '../shared/ToggleField';
import { SelectField } from '../shared/SelectField';
import { Target, Repeat, Activity } from 'lucide-react';

// NOTE: This panel is Phase 6 — wrapped with FeatureGate in RightInspector.
// State connections are placeholders; wire to practiceStore when implemented.

export function PracticeInspector() {
  return (
    <div>
      <InspectorSection title="Practice Target" icon={<Target size={12} />}>
        <SelectField
          label="Difficulty"
          value="intermediate"
          options={[
            { value: 'beginner', label: 'Beginner' },
            { value: 'intermediate', label: 'Intermediate' },
            { value: 'advanced', label: 'Advanced' },
            { value: 'expert', label: 'Expert' },
          ]}
          onChange={() => {}}
        />
        <ToggleField
          label="Note-by-Note"
          value={false}
          onChange={() => {}}
        />
        <ToggleField
          label="Wait for Input"
          value={true}
          onChange={() => {}}
        />
      </InspectorSection>

      <InspectorSection title="Speed Trainer" icon={<Repeat size={12} />}>
        <SliderField
          label="Start %"
          value={50}
          min={10}
          max={100}
          unit="%"
          onChange={() => {}}
        />
        <SliderField
          label="Target %"
          value={100}
          min={10}
          max={150}
          unit="%"
          onChange={() => {}}
        />
        <NumberField
          label="Step"
          value={5}
          min={1}
          max={25}
          unit="%"
          onChange={() => {}}
        />
        <NumberField
          label="Repeats"
          value={3}
          min={1}
          max={20}
          onChange={() => {}}
        />
      </InspectorSection>

      <InspectorSection title="Loop Region" icon={<Activity size={12} />}>
        <NumberField
          label="Start Bar"
          value={1}
          min={1}
          max={999}
          onChange={() => {}}
        />
        <NumberField
          label="End Bar"
          value={4}
          min={1}
          max={999}
          onChange={() => {}}
        />
        <ToggleField
          label="Count-In"
          value={true}
          onChange={() => {}}
        />
        <SliderField
          label="Metronome Vol"
          value={80}
          min={0}
          max={100}
          unit="%"
          onChange={() => {}}
        />
      </InspectorSection>
    </div>
  );
}
