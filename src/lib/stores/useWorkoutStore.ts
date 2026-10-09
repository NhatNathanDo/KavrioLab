'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { useRestTimerStore } from '@/lib/stores/useRestTimerStore';

// ─── Types ───────────────────────────────────────────────────────────────────

export type SetType = 'NORMAL' | 'WARMUP' | 'DROP' | 'FAILURE';

export interface ActiveSet {
  id: string;           // client-only UUID
  setType: SetType;
  weightKg: number;
  repsCompleted: number;
  timeSeconds?: number | null;
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
  isSyncing: boolean;
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
        targetTimeSeconds?: number | null;
      }>;
    }>
  ) => void;
  finishWorkout: () => Promise<void>;
  cancelWorkout: () => Promise<void>;
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
  // Server sync
  syncWithServer: () => Promise<void>;
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'id-' + Math.random().toString(36).substring(2, 9);
}

function createDefaultSet(): ActiveSet {
  return {
    id: generateId(),
    setType: 'NORMAL',
    weightKg: 0,
    repsCompleted: 0,
    timeSeconds: null,
    rpe: null,
    completed: false,
  };
}

let syncTimeout: ReturnType<typeof setTimeout> | null = null;
let lastCancelledAt = 0;

function pushSessionToServer(workout: ActiveWorkout | null) {
  if (typeof window === 'undefined') return;

  if (syncTimeout) {
    clearTimeout(syncTimeout);
    syncTimeout = null;
  }

  // Deletions must occur immediately, never debounced
  if (!workout) {
    fetch('/api/workouts/active', { method: 'DELETE' }).catch(() => {});
    return;
  }

  // If recently cancelled, don't re-push
  if (Date.now() - lastCancelledAt < 4000) {
    return;
  }

  syncTimeout = setTimeout(() => {
    fetch('/api/workouts/active', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workoutName: workout.name,
        startedAt: workout.startedAt,
        workoutData: {
          notes: workout.notes,
          exercises: workout.exercises,
        },
      }),
    }).catch((err) => {
      console.warn('Failed to sync workout session to server:', err);
    });
  }, 600);
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useWorkoutStore = create<WorkoutStore>()(
  persist(
    immer((set, get) => ({
      activeWorkout: null,
      isSyncing: false,

      startWorkout: (name) => {
        lastCancelledAt = 0;
        const startedAt = new Date().toISOString();
        const newWorkout: ActiveWorkout = {
          name,
          startedAt,
          notes: '',
          exercises: [],
        };
        set((state) => {
          state.activeWorkout = newWorkout;
        });
        pushSessionToServer(newWorkout);
      },

      startWorkoutFromTemplate: (name, templateExercises) => {
        lastCancelledAt = 0;
        const startedAt = new Date().toISOString();
        const newWorkout: ActiveWorkout = {
          name,
          startedAt,
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
              timeSeconds: ts.targetTimeSeconds ?? null,
              rpe: null,
              completed: false,
            })),
          })),
        };
        set((state) => {
          state.activeWorkout = newWorkout;
        });
        pushSessionToServer(newWorkout);
      },

      finishWorkout: async () => {
        lastCancelledAt = Date.now();
        if (syncTimeout) {
          clearTimeout(syncTimeout);
          syncTimeout = null;
        }

        set((state) => {
          state.activeWorkout = null;
        });

        if (typeof window !== 'undefined') {
          useRestTimerStore.getState().skip();
          try {
            localStorage.removeItem('kavrio_active_workout');
          } catch {
            // Ignore
          }
        }

        try {
          await fetch('/api/workouts/active', { method: 'DELETE' });
        } catch (err) {
          console.warn('Failed to delete workout session on server:', err);
        }
      },

      cancelWorkout: async () => {
        lastCancelledAt = Date.now();
        if (syncTimeout) {
          clearTimeout(syncTimeout);
          syncTimeout = null;
        }

        set((state) => {
          state.activeWorkout = null;
        });

        if (typeof window !== 'undefined') {
          useRestTimerStore.getState().skip();
          try {
            localStorage.removeItem('kavrio_active_workout');
          } catch {
            // Ignore
          }
        }

        try {
          await fetch('/api/workouts/active', { method: 'DELETE' });
        } catch (err) {
          console.warn('Failed to delete workout session on server:', err);
        }
      },

      setWorkoutName: (name) => {
        set((state) => {
          if (state.activeWorkout) {
            state.activeWorkout.name = name;
          }
        });
        pushSessionToServer(get().activeWorkout);
      },

      setWorkoutNotes: (notes) => {
        set((state) => {
          if (state.activeWorkout) {
            state.activeWorkout.notes = notes;
          }
        });
        pushSessionToServer(get().activeWorkout);
      },

      addExercise: (exerciseId, name) => {
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
        });
        pushSessionToServer(get().activeWorkout);
      },

      removeExercise: (exerciseClientId) => {
        set((state) => {
          if (!state.activeWorkout) return;
          state.activeWorkout.exercises = state.activeWorkout.exercises.filter(
            (e) => e.id !== exerciseClientId
          );
          state.activeWorkout.exercises.forEach((e, i) => {
            e.orderIndex = i;
          });
        });
        pushSessionToServer(get().activeWorkout);
      },

      addSet: (exerciseClientId) => {
        set((state) => {
          if (!state.activeWorkout) return;
          const exercise = state.activeWorkout.exercises.find(
            (e) => e.id === exerciseClientId
          );
          if (exercise) {
            const lastSet = exercise.sets[exercise.sets.length - 1];
            exercise.sets.push({
              ...createDefaultSet(),
              weightKg: lastSet?.weightKg ?? 0,
              repsCompleted: lastSet?.repsCompleted ?? 0,
              setType: 'NORMAL',
            });
          }
        });
        pushSessionToServer(get().activeWorkout);
      },

      updateSet: (exerciseClientId, setId, updates) => {
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
        });
        pushSessionToServer(get().activeWorkout);
      },

      deleteSet: (exerciseClientId, setId) => {
        set((state) => {
          if (!state.activeWorkout) return;
          const exercise = state.activeWorkout.exercises.find(
            (e) => e.id === exerciseClientId
          );
          if (exercise) {
            exercise.sets = exercise.sets.filter((s) => s.id !== setId);
          }
        });
        pushSessionToServer(get().activeWorkout);
      },

      toggleSetComplete: (exerciseClientId, setId) => {
        set((state) => {
          if (!state.activeWorkout) return;
          const exercise = state.activeWorkout.exercises.find(
            (e) => e.id === exerciseClientId
          );
          if (!exercise) return;
          const s = exercise.sets.find((s) => s.id === setId);
          if (s) s.completed = !s.completed;
        });
        pushSessionToServer(get().activeWorkout);
      },

      syncWithServer: async () => {
        // If user recently cancelled/finished within the last 4 seconds, ignore any stale responses
        if (Date.now() - lastCancelledAt < 4000) {
          return;
        }

        try {
          const res = await fetch('/api/workouts/active');
          if (!res.ok) return;
          const data = await res.json();

          if (Date.now() - lastCancelledAt < 4000) {
            return;
          }

          if (data?.active) {
            const s = data.active;
            const exercises = s.workoutData?.exercises || [];
            const notes = s.workoutData?.notes || '';

            set((state) => {
              if (!state.activeWorkout || state.activeWorkout.startedAt !== s.startedAt) {
                state.activeWorkout = {
                  name: s.workoutName,
                  startedAt: s.startedAt,
                  notes,
                  exercises,
                };
              }
            });
          } else {
            // Server has no active session, clear client state if not starting a brand new one
            set((state) => {
              state.activeWorkout = null;
            });
            if (typeof window !== 'undefined') {
              try {
                localStorage.removeItem('kavrio_active_workout');
              } catch {
                // Ignore
              }
            }
          }
        } catch (err) {
          console.warn('Could not sync with active workout session on server:', err);
        }
      },
    })),
    {
      name: 'kavrio_active_workout',
      partialize: (state) => ({ activeWorkout: state.activeWorkout }),
    }
  )
);
