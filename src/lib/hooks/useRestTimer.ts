'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseRestTimerReturn {
  timeLeft: number;
  totalSeconds: number;
  isActive: boolean;
  start: (seconds: number) => void;
  reset: () => void;
  skip: () => void;
  progress: number; // 0..1 for ring animation
}

export function useRestTimer(): UseRestTimerReturn {
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(
    (seconds: number) => {
      clearTimer();
      setTotalSeconds(seconds);
      setTimeLeft(seconds);
      setIsActive(true);
    },
    [clearTimer]
  );

  const reset = useCallback(() => {
    clearTimer();
    setTimeLeft(0);
    setTotalSeconds(0);
    setIsActive(false);
  }, [clearTimer]);

  const skip = useCallback(() => {
    clearTimer();
    setTimeLeft(0);
    setIsActive(false);
  }, [clearTimer]);

  useEffect(() => {
    if (!isActive) return;

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearTimer();
          setIsActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearTimer();
  }, [isActive, clearTimer]);

  const progress = totalSeconds > 0 ? timeLeft / totalSeconds : 0;

  return { timeLeft, totalSeconds, isActive, start, reset, skip, progress };
}
