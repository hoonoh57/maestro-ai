import { create } from 'zustand';
import type { PlayerState, PositionInfo } from '../core/AlphaTabEngine';

interface TransportState {
  playerState: PlayerState;
  isPlayerReady: boolean;
  sfProgress: number; // 0-100
  position: PositionInfo;
  masterVolume: number;
  isLooping: boolean;
  metronomeOn: boolean;
  countInOn: boolean;
  playbackSpeed: number;

  setPlayerState: (s: PlayerState) => void;
  setPlayerReady: () => void;
  setSfProgress: (p: number) => void;
  setPosition: (p: PositionInfo) => void;
  setMasterVolume: (v: number) => void;
  setLooping: (v: boolean) => void;
  toggleMetronome: () => void;
  toggleCountIn: () => void;
  setPlaybackSpeed: (s: number) => void;
}

export const useTransportStore = create<TransportState>()((set) => ({
  playerState: 'stopped',
  isPlayerReady: false,
  sfProgress: 0,
  position: { currentTick: 0, endTick: 0, currentTime: 0, endTime: 0 },
  masterVolume: 80,
  isLooping: false,
  metronomeOn: false,
  countInOn: false,
  playbackSpeed: 1.0,

  setPlayerState: (s) => set({ playerState: s }),
  setPlayerReady: () => set({ isPlayerReady: true }),
  setSfProgress: (p) => set({ sfProgress: p }),
  setPosition: (p) => set({ position: p }),
  setMasterVolume: (v) => set({ masterVolume: v }),
  setLooping: (v) => set({ isLooping: v }),
  toggleMetronome: () => set((s) => ({ metronomeOn: !s.metronomeOn })),
  toggleCountIn: () => set((s) => ({ countInOn: !s.countInOn })),
  setPlaybackSpeed: (s) => set({ playbackSpeed: s }),
}));
