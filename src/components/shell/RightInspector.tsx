import React, { useMemo } from 'react';
import { PanelRight, X } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useEditorStore } from '../../stores/editorStore';
import { useProjectStore } from '../../stores/projectStore';
import { FeatureGate } from '../shared/FeatureGate';
import { ProjectInspector } from '../inspector/ProjectInspector';
import { TrackInspector } from '../inspector/TrackInspector';
import { NoteInspector } from '../inspector/NoteInspector';
import { PracticeInspector } from '../inspector/PracticeInspector';
import { BackingInspector } from '../inspector/BackingInspector';
import { BuskingInspector } from '../inspector/BuskingInspector';

type InspectorContext = 'project' | 'track' | 'note' | 'practice' | 'backing' | 'busking' | 'none';

function useInspectorContext(): InspectorContext {
  const mode = useUIStore((s) => s.mode);
  const selectedNoteId = useEditorStore((s) => s.selectedNoteId);
  const selectedTrackIndex = useEditorStore((s) => s.selectedTrackIndex);

  return useMemo(() => {
    switch (mode) {
      case 'practice': return 'practice';
      case 'backing': return 'backing';
      case 'busking': return 'busking';
      case 'mixer':
      case 'test': return 'none';
      case 'editor':
      default:
        if (selectedNoteId !== null) return 'note';
        if (selectedTrackIndex !== null) return 'track';
        return 'project';
    }
  }, [mode, selectedNoteId, selectedTrackIndex]);
}

const contextLabels: Record<InspectorContext, string> = {
  project: 'Project', track: 'Track', note: 'Note',
  practice: 'Practice', backing: 'Backing Track', busking: 'Busking', none: '',
};

function InspectorBreadcrumb({ context }: { context: InspectorContext }) {
  const name = useProjectStore((s) => s.project.name);
  const selectedTrackIndex = useEditorStore((s) => s.selectedTrackIndex);
  const tracks = useProjectStore((s) => s.project.tracks);
  const trackName = selectedTrackIndex !== null ? tracks[selectedTrackIndex]?.name : null;

  const crumbs: string[] = [name || 'Untitled'];
  if (context === 'track' || context === 'note') crumbs.push(trackName || `Track ${(selectedTrackIndex ?? 0) + 1}`);
  if (context === 'note') crumbs.push('Note');
  if (['practice', 'backing', 'busking'].includes(context)) crumbs.push(contextLabels[context]);

  return (
    <div className="flex items-center gap-1 text-[11px] text-slate-500 px-3 pt-2 pb-1 select-none truncate">
      {crumbs.map((c, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="text-slate-600">/</span>}
          <span className={i === crumbs.length - 1 ? 'text-slate-300' : ''}>{c}</span>
        </React.Fragment>
      ))}
    </div>
  );
}

function InspectorContent({ context }: { context: InspectorContext }) {
  switch (context) {
    case 'project': return <FeatureGate featureId="inspector_panel" mode="overlay"><ProjectInspector /></FeatureGate>;
    case 'track': return <FeatureGate featureId="inspector_panel" mode="overlay"><TrackInspector /></FeatureGate>;
    case 'note': return <FeatureGate featureId="inspector_panel" mode="overlay"><NoteInspector /></FeatureGate>;
    case 'practice': return <FeatureGate featureId="practice_visual_guide" mode="blur"><PracticeInspector /></FeatureGate>;
    case 'backing': return <FeatureGate featureId="ai_band_generator" mode="blur"><BackingInspector /></FeatureGate>;
    case 'busking': return <FeatureGate featureId="busking_playback" mode="blur"><BuskingInspector /></FeatureGate>;
    case 'none': return <div className="flex-1 flex items-center justify-center text-slate-500 text-sm p-6 text-center">No inspector available for this mode.</div>;
  }
}

export function RightInspector() {
  const inspectorVisible = useUIStore((s) => s.inspectorVisible);
  const toggleInspector = useUIStore((s) => s.toggleInspector);
  const context = useInspectorContext();

  if (!inspectorVisible) return null;

  return (
    <aside className="w-[260px] min-w-[260px] max-w-[260px] h-full flex flex-col bg-[#0f172a] border-l border-slate-700/60 text-slate-300 text-[13px] select-none overflow-hidden">
      <div className="flex items-center justify-between h-10 px-3 border-b border-slate-700/60 shrink-0">
        <div className="flex items-center gap-2 text-slate-400">
          <PanelRight size={14} />
          <span className="font-semibold text-[12px] uppercase tracking-wider">{contextLabels[context] || 'Inspector'}</span>
        </div>
        <button onClick={toggleInspector} className="p-1 rounded hover:bg-slate-700/50 text-slate-500 hover:text-slate-300 transition-colors" title="Close Inspector">
          <X size={14} />
        </button>
      </div>
      <InspectorBreadcrumb context={context} />
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <InspectorContent context={context} />
      </div>
    </aside>
  );
}
