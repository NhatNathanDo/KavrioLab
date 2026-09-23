'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, SkipForward, Plus } from 'lucide-react';
import { useRestTimer } from '@/lib/hooks/useRestTimer';
import { useTranslation } from '@/components/language-provider';

const PRESET_DURATIONS = [60, 90, 120, 180];

interface RestTimerOverlayProps {
  initialSeconds?: number;
  onClose: () => void;
}

interface RestTimerModalViewProps {
  timeLeft: number;
  totalSeconds: number;
  progress: number;
  onStart: (seconds: number) => void;
  onSkip: () => void;
}

function RestTimerModalView({
  timeLeft,
  totalSeconds,
  progress,
  onStart,
  onSkip,
}: RestTimerModalViewProps) {
  const { t } = useTranslation();

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // SVG ring parameters (radius 56, viewBox 140x140)
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close rest timer"
        className="absolute inset-0 bg-black/50 dark:bg-black/65 backdrop-blur-sm transition-opacity border-none cursor-pointer w-full h-full"
        onClick={onSkip}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-xs sm:max-w-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-3xl p-6 sm:p-7 shadow-2xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            {t('workouts.restTimer')}
          </p>
          <button
            type="button"
            onClick={onSkip}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-850 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Minimalist Countdown Ring */}
        <div className="relative flex items-center justify-center mx-auto w-40 h-40">
          <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 140 140">
            <circle
              cx="70"
              cy="70"
              r={radius}
              strokeWidth="5"
              className="text-zinc-100 dark:text-zinc-850"
              stroke="currentColor"
              fill="transparent"
            />
            <circle
              cx="70"
              cy="70"
              r={radius}
              strokeWidth="5"
              className="text-emerald-500 transition-all duration-1000 ease-linear"
              stroke="currentColor"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>

          {/* Time digits */}
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-4xl font-bold font-mono tracking-tight text-zinc-900 dark:text-zinc-50 tabular-nums">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
            {totalSeconds > 0 && (
              <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 mt-1">
                {totalSeconds}s
              </span>
            )}
          </div>
        </div>

        {/* Preset duration buttons */}
        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          {PRESET_DURATIONS.map((s) => {
            const label = s < 60 ? `${s}s` : s % 60 === 0 ? `${s / 60}m` : `${s / 60}m`;
            const isSelected = totalSeconds === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => onStart(s)}
                className={`px-3 py-1.5 text-xs rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-50 font-semibold shadow-xs'
                    : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium'
                }`}
              >
                {label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => onStart(timeLeft + 30)}
            className="px-2.5 py-1.5 text-xs rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-650 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium transition-colors cursor-pointer flex items-center gap-0.5"
            title="Add 30s"
          >
            <Plus className="w-3 h-3" />
            30s
          </button>
        </div>

        {/* Skip button */}
        <button
          type="button"
          onClick={onSkip}
          className="w-full py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <SkipForward className="w-3.5 h-3.5" />
          {t('workouts.skipRest')}
        </button>
      </div>
    </div>
  );
}

export function RestTimerOverlay({ initialSeconds = 90, onClose }: RestTimerOverlayProps) {
  const [mounted, setMounted] = useState(false);
  const { timeLeft, totalSeconds, start, skip, progress } = useRestTimer();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSkip = () => {
    skip();
    onClose();
  };

  if (!mounted) return null;

  return createPortal(
    <RestTimerModalView
      timeLeft={timeLeft}
      totalSeconds={totalSeconds}
      progress={progress}
      onStart={start}
      onSkip={handleSkip}
    />,
    document.body
  );
}

// Controlled wrapper that auto-starts the timer on mount
export function RestTimerAutoStart({
  initialSeconds = 90,
  onClose,
}: RestTimerOverlayProps) {
  const [mounted, setMounted] = useState(false);
  const { timeLeft, totalSeconds, isActive, start, skip, progress } = useRestTimer();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-start on mount
  useEffect(() => {
    if (!isActive && timeLeft === 0) {
      start(initialSeconds);
    }
  }, [isActive, timeLeft, start, initialSeconds]);

  const handleSkip = () => {
    skip();
    onClose();
  };

  if (!mounted) return null;
  if (!isActive && timeLeft === 0 && progress === 0) return null;

  return createPortal(
    <RestTimerModalView
      timeLeft={timeLeft}
      totalSeconds={totalSeconds}
      progress={progress}
      onStart={start}
      onSkip={handleSkip}
    />,
    document.body
  );
}
