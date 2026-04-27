import { PropertyRow } from './PropertyRow';

interface ToggleFieldProps {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}

export function ToggleField({
  label,
  value,
  onChange,
  disabled = false,
}: ToggleFieldProps) {
  return (
    <PropertyRow label={label}>
      <button
        onClick={() => !disabled && onChange(!value)}
        disabled={disabled}
        className={`
          relative w-9 h-5 rounded-full transition-colors
          ${value ? 'bg-blue-600' : 'bg-slate-700'}
          ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <span
          className={`
            absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform
            ${value ? 'translate-x-[18px]' : 'translate-x-0.5'}
          `}
        />
      </button>
    </PropertyRow>
  );
}
