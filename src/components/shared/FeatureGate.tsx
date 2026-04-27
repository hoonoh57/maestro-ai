// ─────────────────────────────────────────────────
// src/components/shared/FeatureGate.tsx
// Smart-disabled wrapper for locked features.
// ─────────────────────────────────────────────────

import React, { type ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { useFeatureFlagStore } from '../../stores/featureFlagStore';

interface FeatureGateProps {
  featureId: string;
  children: ReactNode;
  fallback?: ReactNode;
  mode?: 'overlay' | 'blur' | 'disabled' | 'hide';
}

export function FeatureGate({
  featureId,
  children,
  fallback,
  mode = 'overlay',
}: FeatureGateProps) {
  const isActive = useFeatureFlagStore((s) => s.isActive(featureId));
  const flag = useFeatureFlagStore((s) => s.getFlag(featureId));

  if (isActive) {
    return <>{children}</>;
  }

  if (mode === 'hide') {
    return fallback ? <>{fallback}</> : null;
  }

  if (mode === 'disabled') {
    return (
      <div className="opacity-40 pointer-events-none cursor-not-allowed">
        {children}
      </div>
    );
  }

  // overlay or blur
  return (
    <div className="relative">
      <div
        className={
          mode === 'blur'
            ? 'blur-sm opacity-30 pointer-events-none'
            : 'opacity-20 pointer-events-none'
        }
      >
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
        <div className="bg-slate-800/90 border border-slate-700/60 rounded-lg px-6 py-4 text-center max-w-[240px]">
          <Lock size={20} className="text-slate-500 mx-auto mb-2" />
          <p className="text-[12px] text-slate-300 font-medium mb-1">
            {flag?.name ?? featureId}
          </p>
          <p className="text-[10px] text-slate-500">
            Phase {flag?.phase ?? '?'} — Coming Soon
          </p>
        </div>
      </div>
    </div>
  );
}
