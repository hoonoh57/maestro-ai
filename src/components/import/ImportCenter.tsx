import React, { useRef } from 'react';
import { FileAudio, FileImage, FileText, Music, Sparkles, Upload } from 'lucide-react';
import { inspectImportFile } from '../../services/import/FileImportService';

interface ImportCenterProps {
  onOpenFile: (file: File) => void;
  onOpenPrompt: () => void;
  onLoadDemo: () => void;
  onShowOmrInfo: (message: string) => void;
}

function ActionCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-left rounded-2xl border border-slate-700/70 bg-slate-950/50 hover:bg-slate-900/80 hover:border-blue-500/60 transition p-4 shadow-lg group"
    >
      <div className="w-9 h-9 rounded-xl bg-slate-800 group-hover:bg-blue-600 flex items-center justify-center text-slate-300 group-hover:text-white mb-3 transition">
        {icon}
      </div>
      <div className="text-sm font-semibold text-slate-100">{title}</div>
      <div className="text-xs text-slate-500 mt-1 leading-relaxed">{description}</div>
    </button>
  );
}

export function ImportCenter({ onOpenFile, onOpenPrompt, onLoadDemo, onShowOmrInfo }: ImportCenterProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openFilePicker = () => fileInputRef.current?.click();

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    const info = inspectImportFile(file);
    if (!info.canLoadDirectly) {
      onShowOmrInfo(info.message);
      return;
    }

    onOpenFile(file);
  };

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none px-6">
      <div className="w-full max-w-4xl pointer-events-auto rounded-3xl border border-slate-700/70 bg-[#0f172a]/90 shadow-2xl p-6 backdrop-blur-sm">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shrink-0">
            <Music className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Start with a song</h2>
            <p className="text-sm text-slate-400 mt-1">
              Import Guitar Pro / MusicXML, load alphaTex, or generate a playable draft from a simple prompt.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <ActionCard
            icon={<Upload className="w-5 h-5" />}
            title="Open score file"
            description="Load .gp, .gp3, .gp4, .gp5, .gpx, .musicxml, .mxl, .atx, .txt."
            onClick={openFilePicker}
          />
          <ActionCard
            icon={<Sparkles className="w-5 h-5" />}
            title="AI prompt"
            description="Create a short guitar score from genre, tempo, difficulty, and natural language."
            onClick={onOpenPrompt}
          />
          <ActionCard
            icon={<FileImage className="w-5 h-5" />}
            title="PDF / image score"
            description="Prepare PDF, PNG, JPG scores for future OMR to MusicXML conversion."
            onClick={() => onShowOmrInfo('PDF and image scores need OMR conversion to MusicXML before alphaTab can render them.')}
          />
          <ActionCard
            icon={<FileAudio className="w-5 h-5" />}
            title="Load demo"
            description="Open the built-in sample score and verify rendering/playback immediately."
            onClick={onLoadDemo}
          />
        </div>

        <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-500">
          <FileText className="w-3.5 h-3.5" />
          Drag and drop is also supported. PDF/image files are routed to the OMR preparation path.
        </div>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".gp,.gp3,.gp4,.gp5,.gpx,.musicxml,.xml,.mxl,.atx,.tex,.txt,.pdf,.png,.jpg,.jpeg,.webp"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
    </div>
  );
}
