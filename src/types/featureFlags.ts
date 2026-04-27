export type FeatureStatus = 'locked' | 'dev' | 'testing' | 'active';

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  phase: number;
  status: FeatureStatus;
  dependencies: string[];
}