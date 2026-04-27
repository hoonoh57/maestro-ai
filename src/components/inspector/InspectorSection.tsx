import React from 'react';

interface InspectorSectionProps {
  title: string;
  children: React.ReactNode;
}

export function InspectorSection({ title, children }: InspectorSectionProps) {
  return (
    <div className="border-b border-daw-grid last:border-b-0">
      <h3 className="text-xs uppercase tracking-wider text-slate-500 px-3 py-2">{title}</h3>
      <div className="px-3 py-2">{children}</div>
    </div>
  );
}