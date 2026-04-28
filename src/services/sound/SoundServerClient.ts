import type { MaestroSoundEngineKind, MaestroSoundRenderRequest, MaestroSoundRenderResult } from './MaestroSoundEngineTypes';

export interface SoundServerHealth {
  ok: boolean;
  name: string;
  version: string;
  engines: string[];
  outputBaseUrl: string;
}

export interface SoundServerRenderResponse {
  jobId: string;
  status: 'ready' | 'error';
  engine: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  durationSeconds: number;
  sampleRate: number;
  createdAt: string;
  message: string;
}

export interface SoundServerClientConfig {
  baseUrl: string;
  timeoutMs: number;
}

function normalizeBaseUrl(baseUrl: string): string {
  const trimmed = (baseUrl || '').trim();
  if (!trimmed) return 'http://127.0.0.1:8765';
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timer);
  }
}

function toEngineKind(value: string, fallback: MaestroSoundEngineKind): MaestroSoundEngineKind {
  if (value === 'ace_step' || value === 'mock' || value === 'local_ai' || value === 'cloud_ai' || value === 'external_runtime') return value;
  return fallback;
}

export class SoundServerClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(config: SoundServerClientConfig) {
    this.baseUrl = normalizeBaseUrl(config.baseUrl);
    this.timeoutMs = Math.max(1000, config.timeoutMs || 120000);
  }

  async health(): Promise<SoundServerHealth> {
    const response = await fetchWithTimeout(`${this.baseUrl}/api/sound/health`, { method: 'GET' }, 5000);
    if (!response.ok) throw new Error(`Sound server health failed: HTTP ${response.status}`);
    return await response.json() as SoundServerHealth;
  }

  async render(request: MaestroSoundRenderRequest): Promise<MaestroSoundRenderResult> {
    const response = await fetchWithTimeout(
      `${this.baseUrl}/api/sound/render`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: request.projectId,
          projectName: request.projectName,
          engine: request.engine,
          sampleRate: request.sampleRate,
          durationSeconds: request.durationSeconds,
          plan: request.plan,
        }),
      },
      this.timeoutMs,
    );

    if (!response.ok) {
      let detail = '';
      try {
        const errorBody = await response.json();
        detail = errorBody?.detail || errorBody?.message || JSON.stringify(errorBody);
      } catch {
        detail = await response.text();
      }
      throw new Error(`Sound server render failed: HTTP ${response.status}${detail ? ` / ${detail}` : ''}`);
    }

    const payload = await response.json() as SoundServerRenderResponse;
    const absoluteUrl = payload.fileUrl.startsWith('http') ? payload.fileUrl : `${this.baseUrl}${payload.fileUrl}`;

    return {
      jobId: payload.jobId,
      status: payload.status,
      engine: toEngineKind(payload.engine, request.engine),
      fileName: payload.fileName,
      fileUrl: absoluteUrl,
      mimeType: payload.mimeType,
      durationSeconds: payload.durationSeconds,
      sampleRate: payload.sampleRate,
      createdAt: payload.createdAt,
      message: payload.message,
    };
  }
}

export function createSoundServerClient(baseUrl: string, timeoutMs: number): SoundServerClient {
  return new SoundServerClient({ baseUrl, timeoutMs });
}
