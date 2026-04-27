import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children, actions }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-daw-panel border border-daw-grid rounded-lg shadow-2xl max-w-md w-full mx-4">
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-daw-grid">
            <h2 className="text-lg font-bold text-white">{title}</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="px-6 py-4">{children}</div>
        {actions && (
          <div className="px-6 py-4 border-t border-daw-grid flex gap-2 justify-end">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}