import React from 'react';
import { Mic2, MonitorPlay, Music, RefreshCw, Route, Sparkles } from 'lucide-react';
import { useArrangerStore } from '../../stores/arrangerStore';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';

export function BuskingWorkflowPanel() {
  const currentPlan = useArrangerStore((s) => s.currentPlan);
  const preparePlan = useArrangerStore((s) => s.preparePlan);
  const project = useProjectStore((s) => s.project);
  const setMode = useUIStore((s) => s.setMode);

  if (!currentPlan) {
    return (
      <div className="absolute inset-0 z-20 bg-[#0f172a] text-slate-300 flex items-center justify-center p-8">
        <div className="max-w-[560px] rounded-2xl bg-slate-900 border border-slate-700 p-8 text-center">
          <Mic2 size={42} className="mx-auto text-blue-400 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Busking Set Not Prepared</h2>
          <p className="text-sm text-slate-500 leading-relaxed mb-5">
            Prepare a busking version first. Busking mode displays stage cues, arrangement structure, and RenderCache playback status.
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
    <div className="absolute inset-0 z-20 bg-[#020617] text-slate-200 overflow-auto">
      <div className="max-w-[1120px] mx-auto px-6 py-6">
        <div className="rounded-2xl border border-blue-700/40 bg-gradient-to-br from-slate-900 to-blue-950/40 p-6 mb-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-2"><MonitorPlay size={15} /> Busking Performance</div>
              <h1 className="text-3xl font-bold text-white">{project.name || currentPlan.title}</h1>
              <div className="mt-2 text-slate-400">{currentPlan.recommendedKey} · Capo {currentPlan.capo} · {currentPlan.performanceBpm} BPM · {currentPlan.difficulty}</div>
            </div>
            <button onClick={() => setMode('backing')} className="h-10 px-4 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-medium flex items-center gap-2"><Music size={15} /> Open Performance Playback</button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-5">
          <div className="rounded-xl bg-slate-900 border border-slate-700 p-4">
            <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-2">RenderCache</div>
            <div className="text-xl font-bold text-white">{project.renderCache?.masterStatus || 'empty'}</div>
            <div className="text-xs text-slate-500 mt-2 leading-relaxed">{project.renderCache?.message || 'No render cache message.'}</div>
          </div>
          <div className="rounded-xl bg-slate-900 border border-slate-700 p-4">
            <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-2">Performance Goal</div>
            <div className="text-xl font-bold text-white">{currentPlan.goal.replaceAll('_', ' ')}</div>
            <div className="text-xs text-slate-500 mt-2">Status: {currentPlan.status}</div>
          </div>
          <div className="rounded-xl bg-slate-900 border border-slate-700 p-4">
            <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-2">Maestro Sound</div>
            <div className="text-xl font-bold text-white">Prompt Ready</div>
            <div className="text-xs text-slate-500 mt-2">Next phase attaches AI sound generation engine.</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <section className="rounded-xl bg-slate-900 border border-slate-700 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-white mb-3"><Route size={15} /> Stage Route</div>
            <div className="space-y-2">
              {currentPlan.sections.map((section, index) => (
                <div key={section.id} className="rounded bg-slate-950/70 border border-slate-800 p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-slate-100 font-semibold">{index + 1}. {section.name}</div>
                    <div className="text-xs text-slate-500">{section.bars}</div>
                  </div>
                  <div className="text-xs text-blue-300 mt-2">{section.performanceCue}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl bg-slate-900 border border-slate-700 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-white mb-3"><Sparkles size={15} /> Live Cues</div>
            <div className="space-y-3">
              {currentPlan.buskingCues.map((cue, index) => (
                <div key={index} className="flex gap-3 rounded bg-slate-950/70 border border-slate-800 p-3">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">{index + 1}</div>
                  <div className="text-sm text-slate-300 leading-relaxed">{cue}</div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-5 rounded-xl bg-slate-900 border border-slate-700 p-4">
          <div className="text-sm font-semibold text-white mb-2">Maestro Sound Prompt</div>
          <div className="rounded bg-slate-950/70 border border-slate-800 p-3 text-xs text-slate-400 leading-relaxed">{currentPlan.maestroSoundPrompt}</div>
        </section>
      </div>
    </div>
  );
}
