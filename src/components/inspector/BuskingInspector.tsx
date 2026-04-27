import { InspectorSection } from '../shared/InspectorSection';
import { NumberField } from '../shared/NumberField';
import { SliderField } from '../shared/SliderField';
import { ToggleField } from '../shared/ToggleField';
import { SelectField } from '../shared/SelectField';
import { Monitor, ListMusic, Lock } from 'lucide-react';

// Phase 4 — FeatureGated in RightInspector.

export function BuskingInspector() {
  return (
    <div>
      <InspectorSection title="Stage Display" icon={<Monitor size={12} />}>
        <SliderField
          label="Font Size"
          value={18}
          min={10}
          max={48}
          unit="px"
          onChange={() => {}}
        />
        <ToggleField label="Show Chords" value={true} onChange={() => {}} />
        <ToggleField label="Show Lyrics" value={true} onChange={() => {}} />
        <ToggleField label="Auto-Scroll" value={false} onChange={() => {}} />
        <SliderField
          label="Brightness"
          value={100}
          min={30}
          max={100}
          unit="%"
          onChange={() => {}}
        />
      </InspectorSection>

      <InspectorSection title="Setlist" icon={<ListMusic size={12} />}>
        <NumberField
          label="Current #"
          value={1}
          min={1}
          max={999}
          onChange={() => {}}
        />
        <ToggleField label="Loop Setlist" value={false} onChange={() => {}} />
        <ToggleField label="Auto-Advance" value={true} onChange={() => {}} />
        <NumberField label="Gap (sec)" value={5} min={0} max={60} onChange={() => {}} />
      </InspectorSection>

      <InspectorSection title="Safety" icon={<Lock size={12} />} defaultOpen={false}>
        <ToggleField label="Lock Edit" value={false} onChange={() => {}} />
        <ToggleField label="Screen Lock" value={false} onChange={() => {}} />
      </InspectorSection>
    </div>
  );
}
