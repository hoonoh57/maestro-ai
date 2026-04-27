// ─────────────────────────────────────────────────
// src/stores/featureFlagStore.ts
// Feature flag definitions + store
// Phase 1+2 = active, Phase 3-7 = locked
// ─────────────────────────────────────────────────

import { create } from 'zustand';

export type FlagStatus = 'locked' | 'dev' | 'testing' | 'active';

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  phase: number;
  status: FlagStatus;
  dependencies: string[];
}

const FLAGS: FeatureFlag[] = [
  // ── Phase 1 (Core Rendering & Playback) ──────
  { id: 'file_import',       name: 'File Import',         description: 'Load .gp / .musicxml files',       phase: 1, status: 'active', dependencies: [] },
  { id: 'score_render',      name: 'Score Rendering',     description: 'Multi-track notation display',     phase: 1, status: 'active', dependencies: ['file_import'] },
  { id: 'playback',          name: 'Playback Engine',     description: 'Play/pause/stop with SoundFont',   phase: 1, status: 'active', dependencies: ['score_render'] },
  { id: 'playhead',          name: 'Playhead Cursor',     description: 'Moving cursor during playback',    phase: 1, status: 'active', dependencies: ['playback'] },
  { id: 'track_mute_solo',   name: 'Track Mute/Solo',     description: 'Mute and solo per track',          phase: 1, status: 'active', dependencies: ['playback'] },
  { id: 'save_load',         name: 'Save / Load',         description: 'Save/load project to localStorage',phase: 1, status: 'active', dependencies: [] },

  // ── Phase 2 (Editing & Inspector) ────────────
  { id: 'note_insert',       name: 'Note Insert',         description: 'Insert notes into score',          phase: 2, status: 'active', dependencies: ['score_render'] },
  { id: 'note_select',       name: 'Note Selection',      description: 'Click to select notes/beats',      phase: 2, status: 'active', dependencies: ['score_render'] },
  { id: 'note_move',         name: 'Note Move',           description: 'Move selected notes',              phase: 2, status: 'active', dependencies: ['note_select'] },
  { id: 'note_delete',       name: 'Note Delete',         description: 'Delete selected notes',            phase: 2, status: 'active', dependencies: ['note_select'] },
  { id: 'track_crud',        name: 'Track CRUD',          description: 'Add/delete/clone tracks',          phase: 2, status: 'active', dependencies: ['track_mute_solo'] },
  { id: 'inspector_panel',   name: 'Inspector Panel',     description: 'Context-sensitive properties',     phase: 2, status: 'active', dependencies: ['note_select'] },
  { id: 'undo_redo',         name: 'Undo / Redo',         description: 'Ctrl+Z / Ctrl+Y history',         phase: 2, status: 'active', dependencies: ['note_insert'] },

  // ── Phase 3 (Practice Basics) ────────────────
  { id: 'loop_region',       name: 'Loop Region',         description: 'Select and loop a region',         phase: 3, status: 'locked', dependencies: ['playback'] },
  { id: 'metronome',         name: 'Metronome',           description: 'Metronome click during playback',  phase: 3, status: 'locked', dependencies: ['playback'] },
  { id: 'count_in',          name: 'Count-In',            description: 'Count-in before playback starts',  phase: 3, status: 'locked', dependencies: ['playback'] },
  { id: 'speed_trainer',     name: 'Speed Trainer',       description: 'Gradual tempo increase',           phase: 3, status: 'locked', dependencies: ['loop_region'] },
  { id: 'bpm_key_change',    name: 'BPM/Key Change',      description: 'Change BPM and key live',          phase: 3, status: 'locked', dependencies: ['playback'] },

  // ── Phase 4 (Busking) ────────────────────────
  { id: 'busking_playback',  name: 'Busking Playback',    description: 'Stage-ready playback UI',          phase: 4, status: 'locked', dependencies: ['playback'] },
  { id: 'setlist_manager',   name: 'Setlist Manager',     description: 'Manage setlists for busking',      phase: 4, status: 'locked', dependencies: ['busking_playback'] },
  { id: 'busking_lock',      name: 'Busking Lock',        description: 'Lock editing in busking mode',     phase: 4, status: 'locked', dependencies: ['busking_playback'] },
  { id: 'next_song_preview', name: 'Next Song Preview',   description: 'Preview next song in setlist',     phase: 4, status: 'locked', dependencies: ['setlist_manager'] },

  // ── Phase 5 (AI Backing) ─────────────────────
  { id: 'ai_band_generator', name: 'AI Band Generator',   description: 'Generate backing by key/style',    phase: 5, status: 'locked', dependencies: ['playback'] },
  { id: 'stem_mixer',        name: 'Stem Mixer',          description: 'Mix individual stems',             phase: 5, status: 'locked', dependencies: ['ai_band_generator'] },
  { id: 'chord_timeline',    name: 'Chord Timeline',      description: 'Display chord progression',        phase: 5, status: 'locked', dependencies: ['ai_band_generator'] },
  { id: 'backing_export',    name: 'Backing Export',       description: 'Export backing track audio',       phase: 5, status: 'locked', dependencies: ['ai_band_generator'] },
  { id: 'backing_import',    name: 'Backing Import',       description: 'Import external backing tracks',   phase: 5, status: 'locked', dependencies: [] },

  // ── Phase 6 (Practice Feedback) ──────────────
  { id: 'practice_visual_guide', name: 'Practice Visual Guide', description: 'Visual note-by-note guide', phase: 6, status: 'locked', dependencies: ['loop_region'] },
  { id: 'difficulty_levels', name: 'Difficulty Levels',    description: 'Filter notes by difficulty',       phase: 6, status: 'locked', dependencies: ['practice_visual_guide'] },
  { id: 'note_by_note',     name: 'Note-by-Note Mode',    description: 'Step through notes one at a time', phase: 6, status: 'locked', dependencies: ['practice_visual_guide'] },
  { id: 'practice_feedback', name: 'Practice Feedback',   description: 'Accuracy and timing feedback',     phase: 6, status: 'locked', dependencies: ['practice_visual_guide'] },

  // ── Phase 7 (Mixer & Virtual Instruments) ────
  { id: 'mixer_faders',     name: 'Mixer Faders',         description: 'Full mixer with faders',           phase: 7, status: 'locked', dependencies: ['track_mute_solo'] },
  { id: 'effects_sends',    name: 'Effects Sends',        description: 'Reverb/delay sends per track',     phase: 7, status: 'locked', dependencies: ['mixer_faders'] },
  { id: 'virtual_instrument',name:'Virtual Instrument',   description: 'On-screen fretboard/keyboard',     phase: 7, status: 'locked', dependencies: [] },
];

interface FeatureFlagState {
  flags: FeatureFlag[];
  isActive: (id: string) => boolean;
  getFlag: (id: string) => FeatureFlag | undefined;
  setStatus: (id: string, status: FlagStatus) => void;
}

export const useFeatureFlagStore = create<FeatureFlagState>()((set, get) => ({
  flags: FLAGS,

  isActive: (id) => {
    const flag = get().flags.find((f) => f.id === id);
    return flag?.status === 'active';
  },

  getFlag: (id) => get().flags.find((f) => f.id === id),

  setStatus: (id, status) =>
    set((s) => ({
      flags: s.flags.map((f) => (f.id === id ? { ...f, status } : f)),
    })),
}));
