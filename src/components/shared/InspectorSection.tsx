import React, { useState, useCallback, type ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface InspectorSectionProps {
  title: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  badge?: string | number;
  children: ReactNode;
}

export function InspectorSection({
  title,
  icon,
  defaultOpen = true,
  badge,
  children,
}: InspectorSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const toggle = useCallback(() => setOpen((o) => !o), []);

  return (
    <div className="border-b border-slate-700/40">
      {/* Header */}
      <button
        onClick={toggle}
        className="
          w-full flex items-center gap-2
          px-3 py-2 text-left
          text-[12px] font-semibold uppercase tracking-wider
          text-slate-400 hover:text-slate-200
          hover:bg-slate-800/40 transition-colors
        "
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        {icon && <span className="text-slate-500">{icon}</span>}
        <span className="flex-1">{title}</span>
        {badge !== undefined && (
          <span className="text-[10px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </button>

      {/* Body */}
      {open && <div className="px-3 pb-3 space-y-2">{children}</div>}
    </div>
  );
}
