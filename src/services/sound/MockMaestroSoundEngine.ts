import type { MaestroSoundRenderRequest, MaestroSoundRenderResult } from './MaestroSoundEngineTypes';

function writeString(view: DataView, offset: number, value: string): void {
  for (let i = 0; i < value.length; i += 1) view.setUint8(offset + i, value.charCodeAt(i));
}

function createMockPerformanceWav(durationSeconds: number, sampleRate: number, bpm: number): Blob {
  const duration = Math.max(4, Math.min(16, Math.round(durationSeconds)));
  const frames = duration * sampleRate;
  const channels = 2;
  const bytesPerSample = 2;
  const blockAlign = channels * bytesPerSample;
  const dataSize = frames * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  const beatHz = Math.max(0.8, Math.min(3.2, bpm / 60));
  let p = 44;
  for (let i = 0; i < frames; i += 1) {
    const t = i / sampleRate;
    const kick = Math.sin(2 * Math.PI * 62 * t) * Math.exp(-((t * beatHz) % 1) * 12);
    const bass = Math.sin(2 * Math.PI * 110 * t) * 0.25;
    const guitar = (Math.sin(2 * Math.PI * 220 * t) + Math.sin(2 * Math.PI * 330 * t) * 0.6 + Math.sin(2 * Math.PI * 440 * t) * 0.35) * 0.14;
    const shimmer = Math.sin(2 * Math.PI * 880 * t) * 0.04;
    const envelope = 0.55 + 0.45 * Math.sin(2 * Math.PI * beatHz * t) * Math.sin(2 * Math.PI * beatHz * t);
    const sample = Math.max(-0.92, Math.min(0.92, (kick * 0.35 + bass + guitar * envelope + shimmer) * 0.85));
    const left = Math.round(sample * 32767);
    const right = Math.round((sample * 0.92 + guitar * 0.08) * 32767);
    view.setInt16(p, left, true);
    view.setInt16(p + 2, right, true);
    p += 4;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

export async function renderMockMaestroSound(request: MaestroSoundRenderRequest): Promise<MaestroSoundRenderResult> {
  const wav = createMockPerformanceWav(request.durationSeconds, request.sampleRate, request.plan.performanceBpm);
  const url = URL.createObjectURL(wav);
  await new Promise((resolve) => window.setTimeout(resolve, 180));
  return {
    jobId: `mock-sound-${Date.now()}`,
    status: 'ready',
    engine: 'mock',
    fileName: 'maestro-mock-performance-master.wav',
    fileUrl: url,
    mimeType: 'audio/wav',
    durationSeconds: request.durationSeconds,
    sampleRate: request.sampleRate,
    createdAt: new Date().toISOString(),
    message: `Mock Maestro Sound generated for ${request.plan.title}`,
  };
}
