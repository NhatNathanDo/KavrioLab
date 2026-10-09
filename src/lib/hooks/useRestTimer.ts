'use client';

import { useRestTimerStore } from '@/lib/stores/useRestTimerStore';

export function useRestTimer() {
  const {
    timeLeft,
    totalSeconds,
    isActive,
    isFinished,
    isOpen,
    isMinimized,
    start,
    reset,
    skip,
    open,
    close,
    minimize,
    maximize,
    dismissFinished,
    syncWithServer,
  } = useRestTimerStore();

  const progress = totalSeconds > 0 ? Math.min(1, Math.max(0, timeLeft / totalSeconds)) : 0;

  return {
    timeLeft,
    totalSeconds,
    isActive,
    isFinished,
    isOpen,
    isMinimized,
    progress,
    start,
    reset,
    skip,
    open,
    close,
    minimize,
    maximize,
    dismissFinished,
    syncWithServer,
  };
}
