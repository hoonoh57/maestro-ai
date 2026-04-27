import React from 'react';

interface SliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
  className?: string;
  label?: string;
}

export function Slider({ value, min = 0, max = 100, step = 1, onChange, className = '', label }: SliderProps) {
  const percent = ((value - min) / (max - min)) * 100;
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {label && <span className="text-xs text-slate-500 w-6 shrink-0">{label}</span>}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${percent}%, #334155 ${percent}%, #334155 100%)`,
        }}
      />
      <span className="text-xs text-slate-400 w-8 text-right tabular-nums">{value}</span>
    </div>
  );
}