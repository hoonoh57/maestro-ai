import React from 'react';

interface NumberInputProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
}

export function NumberInput({ value, onChange, min = 0, max = 100, step = 1, label }: NumberInputProps) {
  return (
    <div className="flex items-center gap-2">
      {label && <label className="text-xs text-slate-500">{label}</label>}
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="w-16 bg-daw-panel border border-daw-grid rounded px-2 py-1 text-xs text-white text-center outline-none focus:border-daw-accent"
      />
    </div>
  );
}