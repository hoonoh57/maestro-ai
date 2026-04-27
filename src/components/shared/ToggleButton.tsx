import React from 'react';
import clsx from 'clsx';

interface ToggleButtonProps {
  value: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function ToggleButton({ value, onChange, label, disabled }: ToggleButtonProps) {
  return (
    <button
      onClick={() => onChange(!value)}
      disabled={disabled}
      className={clsx(
        'px-3 py-1.5 rounded-md font-medium transition',
        disabled && 'opacity-40 cursor-not-allowed',
        !disabled && (value ? 'bg-daw-accent text-white' : 'bg-daw-bg text-slate-400 hover:text-white')
      )}
    >
      {label ?? (value ? 'ON' : 'OFF')}
    </button>
  );
}