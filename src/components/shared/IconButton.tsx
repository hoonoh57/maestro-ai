import React from 'react';
import clsx from 'clsx';

interface IconButtonProps {
  icon: React.ReactNode;
  label?: string;
  active?: boolean;
  disabled?: boolean;
  danger?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  title?: string;
}

export function IconButton({ icon, label, active, disabled, danger, size = 'md', onClick, title }: IconButtonProps) {
  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'h-8 px-2 text-sm',
    lg: 'h-10 px-3 text-base',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title ?? label}
      className={clsx(
        'inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-all',
        sizeClasses[size],
        disabled && 'opacity-40 cursor-not-allowed',
        !disabled && !active && !danger && 'text-slate-400 hover:text-white hover:bg-slate-700',
        active && 'text-white bg-daw-accent',
        danger && !disabled && 'text-red-400 hover:text-white hover:bg-red-600',
      )}
    >
      {icon}
      {label && <span>{label}</span>}
    </button>
  );
}