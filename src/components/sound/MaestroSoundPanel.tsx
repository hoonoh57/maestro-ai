import React, { useState } from 'react';
import { CheckCircle2, Loader2, Music2, Play, Server, Sparkles, Waves } from 'lucide-react';
import { useArrangerStore } from '../../stores/arrangerStore';
import { useProjectStore } from '../../stores/projectStore';
import { useSoundEngineStore } from '../../stores/soundEngineStore';
import { useUIStore } from '../../stores/uiStore';
import { getSoundServerUrl, setSoundServerUrl } from '../../services/sound/LocalMaestroSoundEngine';
import type { MaestroSoundEngineKind } from '../../services/sound/MaestroSoundEngineTypes';

export function MaestroSoundPanel() {
  const [message, setMessage] = useState('');
  const [serverUrl, setServerUrlState] = useState(getSoundServerUrl());
  const currentPlan = useArrangerStore((s) => s.currentPlan);
  const preparePlan = useArrangerStore((s) => s.preparePlan);
  const project = useProjectStore((s) => s.project);
  const engine = useSoundEngineStore((s) => s.engine);
  const setEngine = useSoundEngineStore((s) => s.setEngine);
  const status = useSoundEngineStore((s) => s.status);
  const lastResult = useSoundEngineStore((s) => s.lastResult);
  const lastHealth = useSoundEngineStore((s) => s.lastHealth);
  const lastError = useSoundEngineStore((s) => s.lastError);
  const checkServer = useSoundEngineStore((s) => s.checkServer);
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

  const handleCheckServer = async () => {
    setMessage('');
    setSoundServerUrl(serverUrl);
    try {
      const health = await checkServer();
      setMessage(`Sound runtime OK: ${health.name} ${health.version} / engines: ${health.engines.join(', ')}`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Sound runtime check failed.');
    }
  };

  const handleEngineChange = (value: string) => {
    setEngine(value as MaestroSoundEngineKind);
  };

  const isServerEngine = engine === 'performance_pack' || engine === 'ace_step' || engine === 'local_ai' || engine === 'external_runtime';

  return (
    <section className="rounded-xl bg-slate-900 border border-slate-700 p-4">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-white"><Sparkles size={15} /> Performance Sound</div>
          <div className="text-xs text-slate-500 mt-1">Maestro Performance Pack is the default CPU backing/playing engine. AI engines remain available as advanced generation options.</div>
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

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Engine</div>
          <select value={engine} onChange={(e) => handleEngineChange(e.target.value)} className="w-full h-9 rounded bg-slate-950 border border-slate-700 px-2 text-xs text-slate-200 outline-none focus:border-blue-500">
            <option value="performance_pack">Maestro Performance Pack</option>
            <option value="ace_step">AI Maestro Sound - ACE-Step</option>
            <option value="local_ai">Local Server Mock</option>
            <option value="mock">Browser Mock</option>
            <option value="external_runtime">External Runtime</option>
          </select>
        </div>
        <div className="col-span-2">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Local Runtime URL</div>
          <div className="flex gap-2">
            <input value={serverUrl} onChange={(e) => setServerUrlState(e.target.value)} onBlur={() => setSoundServerUrl(serverUrl)} className="flex-1 h-9 rounded bg-slate-950 border border-slate-700 px-2 text-xs text-slate-200 outline-none focus:border-blue-500" />
            <button onClick={() => void handleCheckServer()} className="h-9 px-3 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 flex items-center gap-1.5"><Server size={13} /> Check</button>
          </div>
        </div>
      </div>

      {engine === 'performance_pack' && (
        <div className="mb-3 rounded border border-emerald-700/40 bg-emerald-950/20 px-3 py-2 text-[11px] text-emerald-200 leading-relaxed">
          기본 공연/연습 엔진입니다. GPU 없이 CPU에서 WAV backing master를 만들고, Pedalboard가 설치되어 있으면 컴프레서/리버브/리미터 체인을 적용합니다.
        </div>
      )}

      {engine === 'ace_step' && (
        <div className="mb-3 rounded border border-blue-700/40 bg-blue-950/20 px-3 py-2 text-[11px] text-blue-200 leading-relaxed">
          ACE-Step is an advanced AI generation engine. It requires an ACE-Step runtime or future cloud runtime, while the Performance Pack remains the base CPU engine.
        </div>
      )}

      {lastHealth && (
        <div className="mb-3 rounded border border-emerald-700/40 bg-emerald-950/20 px-3 py-2 text-[11px] text-emerald-200">
          Runtime: {lastHealth.name} {lastHealth.version} / engines: {lastHealth.engines.join(', ')}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => void handleGenerate()}
          disabled={status === 'rendering'}
          className="h-9 px-4 rounded bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white text-sm font-medium flex items-center gap-2"
        >
          {status === 'rendering' ? <Loader2 size={14} className="animate-spin" /> : <Waves size={14} />}
          Generate Performance Sound
        </button>
        <button
          onClick={() => setMode('backing')}
          disabled={project.renderCache?.masterStatus !== 'ready'}
          className="h-9 px-4 rounded bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-medium flex items-center gap-2"
        >
          <Play size={14} /> Open Playback
        </button>
      </div>

      {isServerEngine && !lastHealth && (
        <div className="mt-3 text-[11px] text-slate-500 leading-relaxed">For runtime engines, click Check first to verify the local sound runtime.</div>
      )}

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
