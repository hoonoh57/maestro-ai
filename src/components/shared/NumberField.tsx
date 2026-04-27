import { PropertyRow } from './PropertyRow';

interface NumberFieldProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
  disabled?: boolean;
}

export function NumberField({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
  disabled = false,
}: NumberFieldProps) {
  return (
    <PropertyRow label={label}>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className="
          w-full h-7 px-2 text-[12px]
          bg-slate-800 border border-slate-600/50 rounded
          text-slate-300
          focus:border-blue-500 focus:outline-none
          disabled:opacity-40 disabled:cursor-not-allowed
          [appearance:textfield]
          [&::-webkit-inner-spin-button]:appearance-none
        "
      />
      {unit && (
        <span className="text-[10px] text-slate-500 ml-1 shrink-0">
          {unit}
        </span>
      )}
    </PropertyRow>
  );
}
