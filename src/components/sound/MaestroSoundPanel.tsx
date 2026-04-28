import React, { useState } from 'react';
import { CheckCircle2, Loader2, Music2, Play, Sparkles, Waves } from 'lucide-react';
import { useArrangerStore } from '../../stores/arrangerStore';
import { useProjectStore } from '../../stores/projectStore';
import { useSoundEngineStore } from '../../stores/soundEngineStore';
import { useUIStore } from '../../stores/uiStore';

export function MaestroSoundPanel() {
  const [message, setMessage] = useState('');
  const currentPlan = useArrangerStore((s) => s.currentPlan);
  const preparePlan = useArrangerStore((s) => s.preparePlan);
  const project = useProjectStore((s) => s.project);
  const status = useSoundEngineStore((s) => s.status);
  const lastResult = useSoundEngineStore((s) => s.lastResult);
  const lastError = useSoundEngineStore((s) => s.lastError);
  const generateMaestroSound = useSoundEngineStore((s) => s.generateMaestroSound);
  const setMode = useUIStore((s) => s.setMode);

  const handleGenerate = async () => {
    setMessage('');
    if (!currentPlan) preparePlan();
    try {
      const result = await generateMaestroSound();
      setMessage(result.message);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Failed to generate Maestro Sound.');
    }
  };

  return (
    <section className="rounded-xl bg-slate-900 border border-slate-700 p-4">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-white"><Sparkles size={15} /> Maestro Sound Engine</div>
          <div className="text-xs text-slate-500 mt-1">Generate a test performance master and register it into RenderCache.</div>
        </div>
        <div className={`px-2.5 py-1 rounded-full text-[11px] ${status === 'ready' ? 'bg-emerald-900/40 text-emerald-300' : status === 'rendering' ? 'bg-blue-900/40 text-blue-300' : status === 'error' ? 'bg-red-900/40 text-red-300' : 'bg-slate-800 text-slate-400'}`}>{status}</div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="rounded bg-slate-950/60 border border-slate-800 p-3">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Plan</div>
          <div className="text-xs text-slate-200 truncate">{currentPlan?.title || 'No plan yet'}</div>
        </div>
        <div className="rounded bg-slate-950/60 border border-slate-800 p-3">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">RenderCache</div>
          <div className="text-xs text-slate-200 truncate">{project.renderCache?.masterStatus || 'empty'}</div>
        </div>
        <div className="rounded bg-slate-950/60 border border-slate-800 p-3">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Master</div>
          <div className="text-xs text-slate-200 truncate">{lastResult?.fileName || project.renderCache?.items?.[0]?.fileName || 'none'}</div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => void handleGenerate()}
          disabled={status === 'rendering'}
          className="h-9 px-4 rounded bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white text-sm font-medium flex items-center gap-2"
        >
          {status === 'rendering' ? <Loader2 size={14} className="animate-spin" /> : <Waves size={14} />}
          Generate Maestro Sound
        </button>
        <button
          onClick={() => setMode('backing')}
          disabled={project.renderCache?.masterStatus !== 'ready'}
          className="h-9 px-4 rounded bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-medium flex items-center gap-2"
        >
          <Play size={14} /> Open Playback
        </button>
      </div>

      {(message || lastError) && (
        <div className={`mt-3 rounded border px-3 py-2 text-xs flex items-start gap-2 ${lastError ? 'border-red-600/40 bg-red-950/30 text-red-200' : 'border-emerald-600/40 bg-emerald-950/30 text-emerald-200'}`}>
          {lastError ? <Music2 size={14} /> : <CheckCircle2 size={14} />}
          <span>{lastError || message}</span>
        </div>
      )}

      {project.renderCache?.masterStatus === 'ready' && (
        <div className="mt-3 text-[11px] text-slate-500 leading-relaxed">
          RenderCache is ready. Backing, Practice, and Busking can use the same generated performance master.
        </div>
      )}
    </section>
  );
}
