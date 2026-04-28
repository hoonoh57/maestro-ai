import React from 'react';
import { CheckCircle2, Clipboard, Guitar, ListMusic, Music2, PlayCircle, RefreshCw, Sparkles, XCircle, AlertCircle } from 'lucide-react';
import { useArrangerStore } from '../../stores/arrangerStore';
import { useProjectStore } from '../../stores/projectStore';
import type { BuskingGoal } from '../../services/arranger/BuskingArrangementService';

const GOALS: { id: BuskingGoal; label: string; desc: string }[] = [
  { id: 'solo_acoustic', label: 'Solo Acoustic', desc: 'One-person busking guitar-centered version' },
  { id: 'vocal_guitar', label: 'Vocal + Guitar', desc: 'Vocal-supportive arrangement with clean guitar cues' },
  { id: 'full_band', label: 'Full Band', desc: 'Drums, bass, guitar, keys performance plan' },
  { id: 'easy_practice', label: 'Easy Practice', desc: 'Slower simplified practice version' },
  { id: 'stage_performance', label: 'Stage Performance', desc: 'High-energy stage-ready master plan' },
];

function statusIcon(status: 'pass' | 'warn' | 'fail') {
  if (status === 'pass') return <CheckCircle2 size={14} className="text-emerald-400" />;
  if (status === 'warn') return <AlertCircle size={14} className="text-yellow-400" />;
  return <XCircle size={14} className="text-red-400" />;
}

function copyText(text: string) {
  void navigator.clipboard?.writeText(text);
}

export function BuskingArrangePanel() {
  const project = useProjectStore((s) => s.project);
  const goal = useArrangerStore((s) => s.goal);
  const setGoal = useArrangerStore((s) => s.setGoal);
  const currentPlan = useArrangerStore((s) => s.currentPlan);
  const preparePlan = useArrangerStore((s) => s.preparePlan);

  return (
    <div className="absolute inset-0 z-20 bg-[#0f172a] text-slate-200 overflow-auto">
      <div className="max-w-[1180px] mx-auto px-6 py-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles size={15} /> AI Performance Arranger
            </div>
            <h1 className="text-2xl font-bold text-white">Prepare Busking Version</h1>
            <p className="mt-2 text-sm text-slate-400 max-w-[760px] leading-relaxed">
              Convert the current score project into a performance-oriented arrangement plan: structure, key/capo, practice loops, busking cues, and Maestro Sound prompts. This validates the full workflow before the audio generation engine is attached.
            </p>
          </div>
          <button
            onClick={() => preparePlan()}
            className="h-10 px-4 rounded bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium flex items-center gap-2 shrink-0"
          >
            <RefreshCw size={15} /> Prepare Busking Version
          </button>
        </div>

        <div className="grid grid-cols-5 gap-3 mb-6">
          {GOALS.map((item) => (
            <button
              key={item.id}
              onClick={() => setGoal(item.id)}
              className={`text-left rounded-xl border p-3 transition-colors ${goal === item.id ? 'bg-blue-600/20 border-blue-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'}`}
            >
              <div className="text-sm font-semibold">{item.label}</div>
              <div className="text-[11px] text-slate-500 mt-1 leading-relaxed">{item.desc}</div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl bg-slate-900 border border-slate-700 p-4">
            <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">Project</div>
            <div className="text-lg font-semibold text-white truncate">{project.name || 'Untitled Project'}</div>
            <div className="text-sm text-slate-400 mt-2">{project.key || 'C'} · {project.bpm || 120} BPM · {project.timeSignature || '4/4'}</div>
          </div>
          <div className="rounded-xl bg-slate-900 border border-slate-700 p-4">
            <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">Tracks</div>
            <div className="text-lg font-semibold text-white">{project.tracks.length}</div>
            <div className="text-sm text-slate-400 mt-2 truncate">{project.tracks.map((t) => t.name).join(', ') || 'No tracks yet'}</div>
          </div>
          <div className="rounded-xl bg-slate-900 border border-slate-700 p-4">
            <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">RenderCache</div>
            <div className="text-lg font-semibold text-white">{project.renderCache?.masterStatus || 'empty'}</div>
            <div className="text-sm text-slate-400 mt-2 truncate">{project.renderCache?.message || 'No render message'}</div>
          </div>
        </div>

        {!currentPlan && (
          <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-10 text-center text-slate-500">
            <Music2 size={36} className="mx-auto mb-3 text-slate-600" />
            Choose a goal and click <span className="text-slate-300">Prepare Busking Version</span> to generate the full performance workflow plan.
          </div>
        )}

        {currentPlan && (
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-900 border border-slate-700 p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <div className="text-xl font-bold text-white">{currentPlan.title}</div>
                  <div className="text-sm text-slate-500 mt-1">{currentPlan.recommendedKey} · Capo {currentPlan.capo} · {currentPlan.performanceBpm} BPM · {currentPlan.difficulty}</div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs ${currentPlan.validation.status === 'pass' ? 'bg-emerald-900/40 text-emerald-300' : currentPlan.validation.status === 'warn' ? 'bg-yellow-900/40 text-yellow-300' : 'bg-red-900/40 text-red-300'}`}>{currentPlan.validation.status}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {currentPlan.validation.items.map((item) => (
                  <div key={item.id} className="flex items-start gap-2 rounded bg-slate-950/60 border border-slate-800 p-2 text-xs">
                    {statusIcon(item.status)}
                    <div>
                      <div className="text-slate-200 font-medium">{item.label}</div>
                      <div className="text-slate-500 mt-0.5">{item.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <section className="rounded-xl bg-slate-900 border border-slate-700 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-white mb-3"><ListMusic size={15} /> Section Plan</div>
                <div className="space-y-2">
                  {currentPlan.sections.map((s) => (
                    <div key={s.id} className="rounded bg-slate-950/60 border border-slate-800 p-3">
                      <div className="flex justify-between text-sm"><span className="text-slate-100 font-medium">{s.name}</span><span className="text-slate-500">{s.bars}</span></div>
                      <div className="text-xs text-slate-500 mt-1">{s.purpose}</div>
                      <div className="text-xs text-blue-300 mt-2">Cue: {s.performanceCue}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-xl bg-slate-900 border border-slate-700 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-white mb-3"><PlayCircle size={15} /> Practice Loops</div>
                <div className="space-y-2">
                  {currentPlan.practiceLoops.map((loop) => (
                    <div key={loop.id} className="rounded bg-slate-950/60 border border-slate-800 p-3">
                      <div className="flex justify-between text-sm"><span className="text-slate-100 font-medium">{loop.name}</span><span className="text-slate-500">{loop.suggestedTempoPercent}% × {loop.repeatCount}</span></div>
                      <div className="text-xs text-slate-500 mt-1">{loop.target}</div>
                      <div className="text-xs text-emerald-300 mt-2">{loop.cue}</div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <section className="rounded-xl bg-slate-900 border border-slate-700 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-white mb-3"><Guitar size={15} /> Busking Cues</div>
                <ul className="space-y-2 text-sm text-slate-400">
                  {currentPlan.buskingCues.map((cue, i) => <li key={i} className="flex gap-2"><span className="text-blue-400">{i + 1}.</span>{cue}</li>)}
                </ul>
              </section>

              <section className="rounded-xl bg-slate-900 border border-slate-700 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white"><Clipboard size={15} /> Maestro Sound Prompt</div>
                  <button onClick={() => copyText(currentPlan.maestroSoundPrompt)} className="text-xs text-blue-300 hover:text-blue-200">Copy</button>
                </div>
                <div className="rounded bg-slate-950/70 border border-slate-800 p-3 text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">
                  {currentPlan.maestroSoundPrompt}
                </div>
              </section>
            </div>

            <section className="rounded-xl bg-slate-900 border border-slate-700 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold text-white">Render Prompt / Next Sound Engine Input</div>
                <button onClick={() => copyText(currentPlan.renderPrompt)} className="text-xs text-blue-300 hover:text-blue-200">Copy</button>
              </div>
              <pre className="rounded bg-slate-950/70 border border-slate-800 p-3 text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">{currentPlan.renderPrompt}</pre>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
