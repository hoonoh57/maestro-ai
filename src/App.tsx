import React from 'react';
import { AppBar } from './components/shell/AppBar';
import { TransportBar } from './components/shell/TransportBar';
import { LeftSidebar } from './components/shell/LeftSidebar';
import { MainViewport } from './components/shell/MainViewport';
import { RightInspector } from './components/shell/RightInspector';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useUIStore } from './stores/uiStore';

export default function App() {
  useKeyboardShortcuts();
  const sidebar = useUIStore((s) => s.sidebarVisible);
  const inspector = useUIStore((s) => s.inspectorVisible);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0f172a] text-slate-300 overflow-hidden">
      <AppBar />
      <TransportBar />
      <div className="flex-1 flex overflow-hidden">
        {sidebar && <LeftSidebar />}
        <MainViewport />
        {inspector && <RightInspector />}
      </div>
    </div>
  );
}
