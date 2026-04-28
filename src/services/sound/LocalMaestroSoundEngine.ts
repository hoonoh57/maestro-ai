import type { MaestroSoundRenderRequest, MaestroSoundRenderResult } from './MaestroSoundEngineTypes';
import { createSoundServerClient, type SoundServerHealth } from './SoundServerClient';

const SERVER_URL_KEY = 'maestro_sound_server_url';
const SERVER_TIMEOUT_KEY = 'maestro_sound_server_timeout_ms';

export function getSoundServerUrl(): string {
  return localStorage.getItem(SERVER_URL_KEY) || 'http://127.0.0.1:8765';
}

export function setSoundServerUrl(url: string): void {
  localStorage.setItem(SERVER_URL_KEY, (url || '').trim() || 'http://127.0.0.1:8765');
}

export function getSoundServerTimeoutMs(): number {
  const raw = localStorage.getItem(SERVER_TIMEOUT_KEY);
  const value = raw ? Number(raw) : 180000;
  if (!Number.isFinite(value) || value < 5000) return 180000;
  return value;
}

export function setSoundServerTimeoutMs(value: number): void {
  const next = Number.isFinite(value) ? Math.max(5000, Math.round(value)) : 180000;
  localStorage.setItem(SERVER_TIMEOUT_KEY, String(next));
}

export async function checkLocalSoundServer(): Promise<SoundServerHealth> {
  const client = createSoundServerClient(getSoundServerUrl(), getSoundServerTimeoutMs());
  return await client.health();
}

export async function renderWithLocalSoundServer(request: MaestroSoundRenderRequest): Promise<MaestroSoundRenderResult> {
  const client = createSoundServerClient(getSoundServerUrl(), getSoundServerTimeoutMs());
  return await client.render(request);
}
