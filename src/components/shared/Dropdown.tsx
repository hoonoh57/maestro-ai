import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface DropdownProps {
  value: string;
  options: { label: string; value: string }[];
  onChange: (v: string) => void;
  label?: string;
  disabled?: boolean;
}

export function Dropdown({ value, options, onChange, label, disabled }: DropdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={disabled}
        className="flex items-center gap-2 px-2 py-1 bg-daw-panel border border-daw-grid rounded text-sm text-white hover:border-daw-accent transition"
      >
        <span>{options.find(o => o.value === value)?.label ?? 'Select'}</span>
        <ChevronDown className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-daw-panel border border-daw-grid rounded shadow-lg z-50">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className="block w-full text-left px-3 py-2 text-sm text-white hover:bg-slate-700 transition"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}