'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { playRestCompleteSound } from '@/lib/utils/timerAudio';

interface RestTimerState {
  isOpen: boolean;
  isMinimized: boolean;
  isActive: boolean;
  isFinished: boolean;
  timeLeft: number;
  totalSeconds: number;
  targetEndTime: number | null; // Epoch ms

  // Actions
  start: (seconds: number) => void;
  skip: () => void;
  reset: () => void;
  open: () => void;
  close: () => void;
  minimize: () => void;
  maximize: () => void;
  dismissFinished: () => void;
  tick: () => void;
  syncWithServer: () => Promise<void>;
}

let timerInterval: ReturnType<typeof setInterval> | null = null;

function clearStoreInterval() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

export const useRestTimerStore = create<RestTimerState>()(
  persist(
    (set, get) => ({
      isOpen: false,
      isMinimized: false,
      isActive: false,
      isFinished: false,
      timeLeft: 0,
      totalSeconds: 0,
      targetEndTime: null,

      start: (seconds: number) => {
        clearStoreInterval();
        const targetTime = Date.now() + seconds * 1000;

        set({
          isOpen: true,
          isMinimized: false,
          isActive: true,
          isFinished: false,
          timeLeft: seconds,
          totalSeconds: seconds,
          targetEndTime: targetTime,
        });

        // Notify server
        fetch('/api/workouts/active/timer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ seconds }),
        }).catch(() => {});

        // Start ticking
        timerInterval = setInterval(() => {
          get().tick();
        }, 250);
      },

      skip: () => {
        clearStoreInterval();
        set({
          isOpen: false,
          isMinimized: false,
          isActive: false,
          isFinished: false,
          timeLeft: 0,
          totalSeconds: 0,
          targetEndTime: null,
        });

        fetch('/api/workouts/active/timer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clear: true }),
        }).catch(() => {});
      },

      reset: () => {
        get().skip();
      },

      open: () => set({ isOpen: true, isMinimized: false }),
      close: () => set({ isOpen: false, isMinimized: false }),
      minimize: () => set({ isMinimized: true }),
      maximize: () => set({ isMinimized: false, isOpen: true }),
      dismissFinished: () => set({ isFinished: false, isOpen: false, isMinimized: false }),

      tick: () => {
        const { targetEndTime, isActive, isFinished } = get();
        if (!targetEndTime || !isActive) return;

        const remainingMs = targetEndTime - Date.now();
        const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));

        if (remainingMs <= 0) {
          clearStoreInterval();
          set({
            timeLeft: 0,
            isActive: false,
            isFinished: true,
            targetEndTime: null,
          });

          if (!isFinished) {
            playRestCompleteSound();
          }

          fetch('/api/workouts/active/timer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clear: true }),
          }).catch(() => {});
        } else {
          set({ timeLeft: remainingSec });
        }
      },

      syncWithServer: async () => {
        const now = Date.now();
        const state = get();

        // Check local persisted targetEndTime first
        if (state.targetEndTime) {
          const remainingMs = state.targetEndTime - now;
          if (remainingMs > 500) {
            set({
              timeLeft: Math.ceil(remainingMs / 1000),
              isActive: true,
              isOpen: true,
            });
            clearStoreInterval();
            timerInterval = setInterval(() => {
              get().tick();
            }, 250);
          } else if (state.isActive) {
            clearStoreInterval();
            set({
              timeLeft: 0,
              isActive: false,
              isFinished: true,
              isOpen: true,
              targetEndTime: null,
            });
            playRestCompleteSound();
          }
        }

        // Verify with server
        try {
          const res = await fetch('/api/workouts/active/timer');
          if (!res.ok) return;
          const data = await res.json();

          if (data?.active && data.targetEndTime) {
            const serverTargetMs = new Date(data.targetEndTime).getTime();
            const remainingMs = serverTargetMs - Date.now();

            if (remainingMs > 500) {
              set({
                targetEndTime: serverTargetMs,
                totalSeconds: data.totalSeconds || Math.ceil(remainingMs / 1000),
                timeLeft: Math.ceil(remainingMs / 1000),
                isActive: true,
                isFinished: false,
                isOpen: true,
              });
              clearStoreInterval();
              timerInterval = setInterval(() => {
                get().tick();
              }, 250);
            } else if (get().isActive) {
              clearStoreInterval();
              set({
                timeLeft: 0,
                isActive: false,
                isFinished: true,
                isOpen: true,
                targetEndTime: null,
              });
              playRestCompleteSound();
            }
          }
        } catch {
          // Keep offline state if server call fails
        }
      },
    }),
    {
      name: 'kavrio_rest_timer_store',
      partialize: (state) => ({
        isOpen: state.isOpen,
        isMinimized: state.isMinimized,
        isActive: state.isActive,
        totalSeconds: state.totalSeconds,
        targetEndTime: state.targetEndTime,
      }),
    }
  )
);

// Window visibility and focus listeners to prevent lag on phone wake or tab switch
if (typeof window !== 'undefined') {
  const handleVisibility = () => {
    if (document.visibilityState === 'visible') {
      useRestTimerStore.getState().tick();
    }
  };

  window.addEventListener('visibilitychange', handleVisibility);
  window.addEventListener('focus', handleVisibility);
}
