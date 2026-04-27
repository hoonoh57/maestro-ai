import type { ReactNode } from 'react';

interface PropertyRowProps {
  label: string;
  children: ReactNode;
  hint?: string;
}

export function PropertyRow({ label, children, hint }: PropertyRowProps) {
  return (
    <div className="grid grid-cols-[90px_1fr] items-center gap-1 min-h-[28px]">
      <label
        className="text-[11px] text-slate-500 truncate pr-1"
        title={hint || label}
      >
        {label}
      </label>
      <div className="flex items-center">{children}</div>
    </div>
  );
}
