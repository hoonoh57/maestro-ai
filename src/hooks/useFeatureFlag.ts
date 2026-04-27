import { useFeatureFlagStore } from '@/stores/featureFlagStore';

export function useFeatureFlag(id: string) {
  const isActive = useFeatureFlagStore((s) => s.isActive(id));
  const flag = useFeatureFlagStore((s) => s.getFlag(id));
  return { isActive, flag };
}