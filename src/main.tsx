import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppErrorBoundary } from './components/shared/AppErrorBoundary';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  document.body.innerHTML = '<pre style="padding:24px;color:#fee2e2;background:#0f172a;height:100vh;margin:0">MaestroAI boot failed: #root element not found.</pre>';
} else {
  try {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <AppErrorBoundary>
          <App />
        </AppErrorBoundary>
      </React.StrictMode>
    );
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    rootElement.innerHTML = `<pre style="padding:24px;color:#fee2e2;background:#0f172a;height:100vh;margin:0;white-space:pre-wrap">MaestroAI boot failed:\n${err.message}\n\n${err.stack || ''}</pre>`;
    console.error('[MaestroAI] boot failed', err);
  }
}
