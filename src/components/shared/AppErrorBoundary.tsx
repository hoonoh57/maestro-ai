import React from 'react';

interface AppErrorBoundaryState {
  hasError: boolean;
  message: string;
  stack: string;
}

export class AppErrorBoundary extends React.Component<React.PropsWithChildren, AppErrorBoundaryState> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false, message: '', stack: '' };
  }

  static getDerivedStateFromError(error: unknown): AppErrorBoundaryState {
    const err = error instanceof Error ? error : new Error(String(error));
    return {
      hasError: true,
      message: err.message,
      stack: err.stack || '',
    };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo): void {
    console.error('[MaestroAI] React render error', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        minHeight: '100vh',
        background: '#0f172a',
        color: '#e2e8f0',
        fontFamily: 'Consolas, Menlo, monospace',
        padding: 24,
        boxSizing: 'border-box',
      }}>
        <h1 style={{ color: '#f87171', marginTop: 0 }}>MaestroAI render failed</h1>
        <p style={{ color: '#cbd5e1' }}>React 앱 렌더링 중 오류가 발생했습니다. 아래 메시지를 그대로 전달하면 즉시 수정할 수 있습니다.</p>
        <div style={{ background: '#020617', border: '1px solid #334155', borderRadius: 8, padding: 16, whiteSpace: 'pre-wrap' }}>
          <strong>Error:</strong> {this.state.message}
          {'\n\n'}
          {this.state.stack}
        </div>
      </div>
    );
  }
}
