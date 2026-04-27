import { PropertyRow } from './PropertyRow';

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
}: TextFieldProps) {
  return (
    <PropertyRow label={label}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="
          w-full h-7 px-2 text-[12px]
          bg-slate-800 border border-slate-600/50 rounded
          text-slate-300 placeholder-slate-600
          focus:border-blue-500 focus:outline-none
          disabled:opacity-40 disabled:cursor-not-allowed
        "
      />
    </PropertyRow>
  );
}
