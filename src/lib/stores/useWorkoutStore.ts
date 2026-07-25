'use client';

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// ─── Types ───────────────────────────────────────────────────────────────────

export type SetType = 'NORMAL' | 'WARMUP' | 'DROP' | 'FAILURE';

export interface ActiveSet {
  id: string;           // client-only UUID
  setType: SetType;
  weightKg: number;
  repsCompleted: number;
  rpe: number | null;
  completed: boolean;
}

export interface ActiveExercise {
  id: string;           // client-only UUID
  exerciseId: string;   // DB exercise ID
  name: string;
  orderIndex: number;
  sets: ActiveSet[];
}

export interface ActiveWorkout {
  name: string;
  startedAt: string;    // ISO string
  notes: string;
  exercises: ActiveExercise[];
}

interface WorkoutStore {
  activeWorkout: ActiveWorkout | null;
  // Session actions
  startWorkout: (name: string) => void;
  startWorkoutFromTemplate: (
    name: string,
    exercises: Array<{
      exerciseId: string;
      name: string;
      sets: Array<{
        setType: SetType;
        targetWeightKg?: number | null;
        targetReps?: number | null;
      }>;
    }>
  ) => void;
  finishWorkout: () => void;
  cancelWorkout: () => void;
  setWorkoutName: (name: string) => void;
  setWorkoutNotes: (notes: string) => void;
  // Exercise actions
  addExercise: (exerciseId: string, name: string) => void;
  removeExercise: (exerciseClientId: string) => void;
  // Set actions
  addSet: (exerciseClientId: string) => void;
  updateSet: (exerciseClientId: string, setId: string, updates: Partial<ActiveSet>) => void;
  deleteSet: (exerciseClientId: string, setId: string) => void;
  toggleSetComplete: (exerciseClientId: string, setId: string) => void;
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return crypto.randomUUID();
}

function createDefaultSet(): ActiveSet {
  return {
    id: generateId(),
    setType: 'NORMAL',
    weightKg: 0,
    repsCompleted: 0,
    rpe: null,
    completed: false,
  };
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useWorkoutStore = create<WorkoutStore>()(
  immer((set) => ({
    activeWorkout: null,

    startWorkout: (name) =>
      set((state) => {
        state.activeWorkout = {
          name,
          startedAt: new Date().toISOString(),
          notes: '',
          exercises: [],
        };
      }),

    startWorkoutFromTemplate: (name, templateExercises) =>
      set((state) => {
        state.activeWorkout = {
          name,
          startedAt: new Date().toISOString(),
          notes: '',
          exercises: templateExercises.map((te, idx) => ({
            id: generateId(),
            exerciseId: te.exerciseId,
            name: te.name,
            orderIndex: idx,
            sets: te.sets.map((ts) => ({
              id: generateId(),
              setType: ts.setType,
              weightKg: ts.targetWeightKg ?? 0,
              repsCompleted: ts.targetReps ?? 0,
              rpe: null,
              completed: false,
            })),
          })),
        };
      }),

    finishWorkout: () =>
      set((state) => {
        state.activeWorkout = null;
      }),

    cancelWorkout: () =>
      set((state) => {
        state.activeWorkout = null;
      }),

    setWorkoutName: (name) =>
      set((state) => {
        if (state.activeWorkout) state.activeWorkout.name = name;
      }),

    setWorkoutNotes: (notes) =>
      set((state) => {
        if (state.activeWorkout) state.activeWorkout.notes = notes;
      }),

    addExercise: (exerciseId, name) =>
      set((state) => {
        if (!state.activeWorkout) return;
        const orderIndex = state.activeWorkout.exercises.length;
        state.activeWorkout.exercises.push({
          id: generateId(),
          exerciseId,
          name,
          orderIndex,
          sets: [createDefaultSet()],
        });
      }),

    removeExercise: (exerciseClientId) =>
      set((state) => {
        if (!state.activeWorkout) return;
        state.activeWorkout.exercises = state.activeWorkout.exercises.filter(
          (e) => e.id !== exerciseClientId
        );
        // Re-index order
        state.activeWorkout.exercises.forEach((e, i) => {
          e.orderIndex = i;
        });
      }),

    addSet: (exerciseClientId) =>
      set((state) => {
        if (!state.activeWorkout) return;
        const exercise = state.activeWorkout.exercises.find(
          (e) => e.id === exerciseClientId
        );
        if (exercise) {
          // Copy last set values as default for new set
          const lastSet = exercise.sets[exercise.sets.length - 1];
          exercise.sets.push({
            ...createDefaultSet(),
            weightKg: lastSet?.weightKg ?? 0,
            repsCompleted: lastSet?.repsCompleted ?? 0,
            setType: 'NORMAL',
          });
        }
      }),

    updateSet: (exerciseClientId, setId, updates) =>
      set((state) => {
        if (!state.activeWorkout) return;
        const exercise = state.activeWorkout.exercises.find(
          (e) => e.id === exerciseClientId
        );
        if (!exercise) return;
        const setIndex = exercise.sets.findIndex((s) => s.id === setId);
        if (setIndex >= 0) {
          Object.assign(exercise.sets[setIndex], updates);
        }
      }),

    deleteSet: (exerciseClientId, setId) =>
      set((state) => {
        if (!state.activeWorkout) return;
        const exercise = state.activeWorkout.exercises.find(
          (e) => e.id === exerciseClientId
        );
        if (exercise) {
          exercise.sets = exercise.sets.filter((s) => s.id !== setId);
        }
      }),

    toggleSetComplete: (exerciseClientId, setId) =>
      set((state) => {
        if (!state.activeWorkout) return;
        const exercise = state.activeWorkout.exercises.find(
          (e) => e.id === exerciseClientId
        );
        if (!exercise) return;
        const s = exercise.sets.find((s) => s.id === setId);
        if (s) s.completed = !s.completed;
      }),
  }))
);
