import React, { useMemo, useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import {
  generateAlphaTexFromPrompt,
  getPromptPreset,
  type PromptDifficulty,
  type PromptGenre,
} from '../../services/generation/PromptSongGenerator';

interface PromptSongDialogProps {
  onClose: () => void;
  onGenerate: (tex: string) => void;
}

const GENRES: { value: PromptGenre; label: string }[] = [
  { value: 'ballad', label: 'Ballad' },
  { value: 'kpop', label: 'K-pop' },
  { value: 'rock', label: 'Rock' },
  { value: 'blues', label: 'Blues' },
  { value: 'jazz', label: 'Jazz' },
];

const DIFFICULTIES: { value: PromptDifficulty; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

export function PromptSongDialog({ onClose, onGenerate }: PromptSongDialogProps) {
  const [genre, setGenre] = useState<PromptGenre>('ballad');
  const [difficulty, setDifficulty] = useState<PromptDifficulty>('beginner');
  const [bpm, setBpm] = useState(90);
  const [keyName, setKeyName] = useState('C');
  const [bars, setBars] = useState(8);
  const [prompt, setPrompt] = useState(getPromptPreset('ballad'));

  const preview = useMemo(() => {
    return generateAlphaTexFromPrompt({ prompt, genre, difficulty, bpm, key: keyName, bars });
  }, [bars, bpm, difficulty, genre, keyName, prompt]);

  const handleGenreChange = (nextGenre: PromptGenre) => {
    setGenre(nextGenre);
    setPrompt(getPromptPreset(nextGenre));
  };

  const handleGenerate = () => {
    onGenerate(preview);
    onClose();
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-[#0f172a] shadow-2xl overflow-hidden">
        <div className="h-12 px-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Sparkles className="w-4 h-4 text-blue-400" />
            AI Song Prompt
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-[1fr_220px] gap-4">
          <div className="space-y-3">
            <label className="block text-xs text-slate-400">
              Prompt
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="mt-1 w-full h-24 rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 resize-none"
              />
            </label>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <label className="text-xs text-slate-400">
                Genre
                <select
                  value={genre}
                  onChange={(e) => handleGenreChange(e.target.value as PromptGenre)}
                  className="mt-1 w-full rounded bg-slate-900 border border-slate-700 px-2 py-1.5 text-sm text-slate-100"
                >
                  {GENRES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </label>

              <label className="text-xs text-slate-400">
                Difficulty
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as PromptDifficulty)}
                  className="mt-1 w-full rounded bg-slate-900 border border-slate-700 px-2 py-1.5 text-sm text-slate-100"
                >
                  {DIFFICULTIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </label>

              <label className="text-xs text-slate-400">
                BPM
                <input
                  type="number"
                  value={bpm}
                  onChange={(e) => setBpm(Number(e.target.value))}
                  className="mt-1 w-full rounded bg-slate-900 border border-slate-700 px-2 py-1.5 text-sm text-slate-100"
                />
              </label>

              <label className="text-xs text-slate-400">
                Bars
                <select
                  value={bars}
                  onChange={(e) => setBars(Number(e.target.value))}
                  className="mt-1 w-full rounded bg-slate-900 border border-slate-700 px-2 py-1.5 text-sm text-slate-100"
                >
                  <option value={4}>4</option>
                  <option value={8}>8</option>
                  <option value={16}>16</option>
                  <option value={32}>32</option>
                </select>
              </label>
            </div>

            <label className="block text-xs text-slate-400">
              Key
              <input
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                className="mt-1 w-24 rounded bg-slate-900 border border-slate-700 px-2 py-1.5 text-sm text-slate-100"
              />
            </label>
          </div>

          <div className="rounded-xl bg-slate-900 border border-slate-700 p-3 overflow-hidden">
            <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">alphaTex Preview</div>
            <pre className="h-64 overflow-auto text-[10px] leading-relaxed text-slate-300 whitespace-pre-wrap">{preview}</pre>
          </div>
        </div>

        <div className="px-4 py-3 border-t border-slate-700 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800">
            Cancel
          </button>
          <button onClick={handleGenerate} className="px-4 py-1.5 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-500">
            Generate Score
          </button>
        </div>
      </div>
    </div>
  );
}
