import React from 'react';
import { Dumbbell, PlayCircle, RefreshCw, Timer, CheckCircle2 } from 'lucide-react';
import { useArrangerStore } from '../../stores/arrangerStore';
import { useUIStore } from '../../stores/uiStore';

export function PracticeWorkflowPanel() {
  const currentPlan = useArrangerStore((s) => s.currentPlan);
  const preparePlan = useArrangerStore((s) => s.preparePlan);
  const setMode = useUIStore((s) => s.setMode);

  if (!currentPlan) {
    return (
      <div className="absolute inset-0 z-20 bg-[#0f172a] text-slate-300 flex items-center justify-center p-8">
        <div className="max-w-[560px] rounded-2xl bg-slate-900 border border-slate-700 p-8 text-center">
          <Dumbbell size={42} className="mx-auto text-blue-400 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Practice Plan Not Prepared</h2>
          <p className="text-sm text-slate-500 leading-relaxed mb-5">
            Create a busking arrangement first. The practice mode uses the generated practice loops, tempo targets, and performance cues.
          </p>
          <div className="flex justify-center gap-2">
            <button onClick={() => setMode('arrange')} className="h-9 px-4 rounded bg-slate-800 hover:bg-slate-700 text-sm text-slate-200">Go to Arrange</button>
            <button onClick={() => preparePlan()} className="h-9 px-4 rounded bg-blue-600 hover:bg-blue-500 text-sm text-white flex items-center gap-2"><RefreshCw size={14} /> Auto Prepare</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-20 bg-[#0f172a] text-slate-200 overflow-auto">
      <div className="max-w-[980px] mx-auto px-6 py-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-2"><Dumbbell size={15} /> Practice Workflow</div>
          <h1 className="text-2xl font-bold text-white">{currentPlan.title}</h1>
          <p className="text-sm text-slate-500 mt-2">Practice with generated loops before moving to busking mode. This validates the Arrange → Practice handoff.</p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="rounded-xl bg-slate-900 border border-slate-700 p-4">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">Target Key</div>
            <div className="text-xl font-bold text-white">{currentPlan.recommendedKey}</div>
            <div className="text-sm text-slate-500 mt-1">Capo {currentPlan.capo}</div>
          </div>
          <div className="rounded-xl bg-slate-900 border border-slate-700 p-4">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">Practice BPM</div>
            <div className="text-xl font-bold text-white">{currentPlan.performanceBpm}</div>
            <div className="text-sm text-slate-500 mt-1">Source {currentPlan.sourceBpm}</div>
          </div>
          <div className="rounded-xl bg-slate-900 border border-slate-700 p-4">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">Loops</div>
            <div className="text-xl font-bold text-white">{currentPlan.practiceLoops.length}</div>
            <div className="text-sm text-slate-500 mt-1">Auto-generated</div>
          </div>
        </div>

        <div className="space-y-3">
          {currentPlan.practiceLoops.map((loop, index) => (
            <div key={loop.id} className="rounded-xl bg-slate-900 border border-slate-700 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-white font-semibold"><PlayCircle size={15} className="text-blue-400" /> {index + 1}. {loop.name}</div>
                  <div className="text-sm text-slate-500 mt-1">Target: {loop.target}</div>
                  <div className="text-sm text-emerald-300 mt-2">{loop.cue}</div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center shrink-0">
                  <div className="rounded bg-slate-950 border border-slate-800 px-3 py-2">
                    <div className="text-[10px] text-slate-500 uppercase">Tempo</div>
                    <div className="text-sm text-white font-semibold">{loop.suggestedTempoPercent}%</div>
                  </div>
                  <div className="rounded bg-slate-950 border border-slate-800 px-3 py-2">
                    <div className="text-[10px] text-slate-500 uppercase">Repeat</div>
                    <div className="text-sm text-white font-semibold">× {loop.repeatCount}</div>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <Timer size={13} /> Use Backing A-B Loop for this target section after RenderCache master is available.
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-xl bg-emerald-950/30 border border-emerald-700/40 p-4 text-sm text-emerald-200 flex items-start gap-2">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
          <div>Practice workflow is ready. Next validation step: load or generate RenderCache master in Backing, then use these loops for section practice.</div>
        </div>
      </div>
    </div>
  );
}
