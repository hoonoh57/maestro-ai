import { PropertyRow } from './PropertyRow';

interface SliderFieldProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
  disabled?: boolean;
}

export function SliderField({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  onChange,
  disabled = false,
}: SliderFieldProps) {
  return (
    <PropertyRow label={label}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className="
          flex-1 h-1.5 appearance-none rounded-full
          bg-slate-700 accent-blue-500
          disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed
        "
      />
      <span className="text-[11px] text-slate-400 w-10 text-right tabular-nums ml-1">
        {value}
        {unit}
      </span>
    </PropertyRow>
  );
}
