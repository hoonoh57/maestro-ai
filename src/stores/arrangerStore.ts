import { create } from 'zustand';
import { useProjectStore } from './projectStore';
import {
  createBuskingArrangementPlan,
  summarizePlanForRenderCache,
  type BuskingArrangementPlan,
  type BuskingGoal,
} from '../services/arranger/BuskingArrangementService';

interface ArrangerState {
  goal: BuskingGoal;
  currentPlan: BuskingArrangementPlan | null;
  history: BuskingArrangementPlan[];
  setGoal: (goal: BuskingGoal) => void;
  preparePlan: () => BuskingArrangementPlan;
  clearPlan: () => void;
}

export const useArrangerStore = create<ArrangerState>((set, get) => ({
  goal: 'solo_acoustic',
  currentPlan: null,
  history: [],

  setGoal: (goal) => set({ goal }),

  preparePlan: () => {
    const projectStore = useProjectStore.getState();
    const plan = createBuskingArrangementPlan(projectStore.project, get().goal);
    projectStore.markRenderCacheDirty(`AI Performance Sound required: ${summarizePlanForRenderCache(plan)}`);
    set((state) => ({
      currentPlan: plan,
      history: [plan, ...state.history].slice(0, 12),
    }));
    return plan;
  },

  clearPlan: () => set({ currentPlan: null }),
}));
