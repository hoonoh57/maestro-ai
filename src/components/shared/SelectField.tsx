import { PropertyRow } from './PropertyRow';

interface SelectFieldProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  disabled?: boolean;
}

export function SelectField({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: SelectFieldProps) {
  return (
    <PropertyRow label={label}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="
          w-full h-7 px-2 text-[12px]
          bg-slate-800 border border-slate-600/50 rounded
          text-slate-300
          focus:border-blue-500 focus:outline-none
          disabled:opacity-40 disabled:cursor-not-allowed
        "
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </PropertyRow>
  );
}
