import type { BuskingArrangementPlan } from '../arranger/BuskingArrangementService';

export type MaestroSoundEngineKind = 'mock' | 'local_ai' | 'cloud_ai' | 'external_runtime';
export type MaestroSoundJobStatus = 'idle' | 'queued' | 'rendering' | 'ready' | 'error';

export interface MaestroSoundRenderRequest {
  projectId: string;
  projectName: string;
  plan: BuskingArrangementPlan;
  engine: MaestroSoundEngineKind;
  sampleRate: number;
  durationSeconds: number;
}

export interface MaestroSoundRenderResult {
  jobId: string;
  status: MaestroSoundJobStatus;
  engine: MaestroSoundEngineKind;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  durationSeconds: number;
  sampleRate: number;
  createdAt: string;
  message: string;
}

export interface MaestroSoundDiagnostics {
  hasPlan: boolean;
  hasGeneratedMaster: boolean;
  status: MaestroSoundJobStatus;
  engine: MaestroSoundEngineKind;
  lastMessage: string;
}
