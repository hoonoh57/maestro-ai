import React from 'react';
import { Music, Wand2, FileUp, PlusCircle } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-daw-bg/80 z-10">
      <div className="text-center max-w-md">
        <Music className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">악보가 비어 있습니다</h2>
        <p className="text-sm text-slate-400 mb-8">
          Generate Band 또는 왼쪽 패늷에서 음표를 삽입하세요.
        </p>
        <div className="flex flex-col gap-3 items-center">
          <button className="flex items-center gap-2 px-6 py-3 bg-daw-accent text-white rounded-lg font-medium hover:bg-blue-600 transition w-64">
            <Wand2 className="w-5 h-5" />
            Generate Starter Band
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-600 transition w-64">
            <PlusCircle className="w-5 h-5" />
            Add First Note
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-600 transition w-64">
            <FileUp className="w-5 h-5" />
            Import Project
          </button>
        </div>
      </div>
    </div>
  );
}