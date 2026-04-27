import { create } from 'zustand';
import type * as alphaTab from '@coderline/alphatab';
import type { NoteDuration, InsertTool, NoteSelection, NoteData } from '@/types/project';

interface EditorState {
  selectedTool: InsertTool;
  selectedDuration: NoteDuration;
  selectedNote: NoteSelection | null;
  selectedTrackIndex: number | null;
  selectedNoteId: string | null;
  selectedNoteData: NoteData | null;
  selectedBeat: alphaTab.model.Beat | null;

  setTool: (tool: InsertTool) => void;
  setDuration: (dur: NoteDuration) => void;
  setSelectedNote: (sel: NoteSelection | null) => void;
  setSelectedTrackIndex: (idx: number | null) => void;
  selectNote: (id: string, data: NoteData) => void;
  selectBeat: (beat: alphaTab.model.Beat) => void;
  selectNoteFromModel: (note: alphaTab.model.Note) => void;
  updateSelectedNote: (patch: Partial<NoteData>) => void;
  clearSelection: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  selectedTool: 'select',
  selectedDuration: 'quarter',
  selectedNote: null,
  selectedTrackIndex: null,
  selectedNoteId: null,
  selectedNoteData: null,
  selectedBeat: null,

  setTool: (selectedTool) => set({ selectedTool }),
  setDuration: (selectedDuration) => set({ selectedDuration }),
  setSelectedNote: (selectedNote) => set({ selectedNote }),
  setSelectedTrackIndex: (selectedTrackIndex) => set({ selectedTrackIndex }),
  selectNote: (selectedNoteId, selectedNoteData) => set({ selectedNoteId, selectedNoteData, selectedBeat: null }),
  selectBeat: (beat) =>
    set({
      selectedBeat: beat,
      selectedTrackIndex: beat.voice.bar.staff.track.index,
      selectedNoteId: null,
      selectedNoteData: null,
    }),
  selectNoteFromModel: (note) =>
    set({
      selectedBeat: note.beat,
      selectedTrackIndex: note.beat.voice.bar.staff.track.index,
      selectedNoteId: `note-${note.id}`,
      selectedNoteData: {
        id: `note-${note.id}`,
        trackIndex: note.beat.voice.bar.staff.track.index,
        measure: note.beat.voice.bar.index + 1,
        beat: note.beat.index + 1,
        string: note.string,
        fret: note.fret,
        midiNumber: note.realValue,
        duration: note.beat.duration,
        dotted: note.beat.dots > 0,
        triplet: note.beat.tupletNumerator === 3,
        dynamic: 'mf',
        velocity: note.dynamics,
        accidental: 'none',
        hammerOn: note.isHammerPullOrigin,
        pullOff: false,
        slide: note.slideInType !== 0 || note.slideOutType !== 0,
        bend: note.hasBend,
        vibrato: note.vibrato !== 0,
        harmonic: note.harmonicType !== 0,
        palmMute: note.isPalmMute,
        letRing: note.isLetRing,
        ghost: note.isGhost,
        accent: note.accentuated !== 0,
        staccato: note.beat.isStaccato ?? false,
      },
    }),
  updateSelectedNote: (patch) =>
    set((state) => ({
      selectedNoteData: state.selectedNoteData ? { ...state.selectedNoteData, ...patch } : null,
    })),
  clearSelection: () => set({
    selectedBeat: null,
    selectedNoteId: null,
    selectedNoteData: null,
  }),
}));