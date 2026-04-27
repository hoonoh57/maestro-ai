import React from 'react';
import { useUIStore } from '@/stores/uiStore';

interface BottomPanelProps {
  open: boolean;
}

export function BottomPanel({ open }: BottomPanelProps) {
  if (!open) return null;

  return (
    <div className="h-40 bg-daw-bg border-t border-daw-grid flex flex-col shrink-0">
      {/* Bottom Panel 콘들을 나중에 완성 */}
    </div>
  );
}