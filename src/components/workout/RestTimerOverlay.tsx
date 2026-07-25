'use client';

import { X, SkipForward } from 'lucide-react';
import { useRestTimer } from '@/lib/hooks/useRestTimer';

const PRESET_DURATIONS = [60, 90, 120, 180];

interface RestTimerOverlayProps {
  initialSeconds?: number;
  onClose: () => void;
}

export function RestTimerOverlay({ initialSeconds = 90, onClose }: RestTimerOverlayProps) {
  const { timeLeft, isActive, start, skip, progress } = useRestTimer();

  // Auto-start on mount
  const hasStarted = timeLeft > 0 || isActive;
  if (!hasStarted) {
    // We call start via useEffect to avoid render-during-render
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // SVG ring parameters
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const handleSkip = () => {
    skip();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pb-8 px-4 sm:items-center sm:pb-0">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleSkip}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-8 shadow-2xl text-center space-y-6">
        {/* Close */}
        <button
          type="button"
          onClick={handleSkip}
          className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Close timer"
        >
          <X className="w-4 h-4" />
        </button>

        <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-400">
          Rest Timer
        </p>

        {/* Ring */}
        <div className="relative flex items-center justify-center mx-auto w-36 h-36">
          <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60" cy="60" r={radius}
              strokeWidth="6"
              stroke="currentColor"
              className="text-zinc-100 dark:text-zinc-800"
              fill="transparent"
            />
            <circle
              cx="60" cy="60" r={radius}
              strokeWidth="6"
              stroke="currentColor"
              className="text-emerald-500 transition-all duration-1000"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute text-center">
            <span className="text-3xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Preset buttons */}
        <div className="flex gap-2 justify-center">
          {PRESET_DURATIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => start(s)}
              className="px-3 py-1.5 text-[10px] font-semibold rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              {s < 60 ? `${s}s` : `${s / 60}m`}
            </button>
          ))}
        </div>

        {/* Skip */}
        <button
          type="button"
          onClick={handleSkip}
          className="flex items-center gap-2 mx-auto text-xs text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
        >
          <SkipForward className="w-3.5 h-3.5" />
          Skip rest
        </button>
      </div>
    </div>
  );
}

// Controlled wrapper that auto-starts the timer on mount
export function RestTimerAutoStart({
  initialSeconds = 90,
  onClose,
}: RestTimerOverlayProps) {
  const { timeLeft, isActive, start, skip, progress } = useRestTimer();

  // Auto-start on mount
  if (!isActive && timeLeft === 0) {
    start(initialSeconds);
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const handleSkip = () => {
    skip();
    onClose();
  };

  if (!isActive && timeLeft === 0 && progress === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pb-8 px-4 sm:items-center sm:pb-0">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleSkip} />
      <div className="relative z-10 w-full max-w-sm bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-8 shadow-2xl text-center space-y-6">
        <button
          type="button"
          onClick={handleSkip}
          className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Close timer"
        >
          <X className="w-4 h-4" />
        </button>
        <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-400">Rest Timer</p>
        <div className="relative flex items-center justify-center mx-auto w-36 h-36">
          <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r={radius} strokeWidth="6" stroke="currentColor" className="text-zinc-100 dark:text-zinc-800" fill="transparent" />
            <circle cx="60" cy="60" r={radius} strokeWidth="6" stroke="currentColor" className="text-emerald-500 transition-all duration-1000" fill="transparent" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" />
          </svg>
          <div className="absolute text-center">
            <span className="text-3xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>
        </div>
        <div className="flex gap-2 justify-center">
          {PRESET_DURATIONS.map((s) => (
            <button key={s} type="button" onClick={() => start(s)} className="px-3 py-1.5 text-[10px] font-semibold rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
              {s < 60 ? `${s}s` : `${s / 60}m`}
            </button>
          ))}
        </div>
        <button type="button" onClick={handleSkip} className="flex items-center gap-2 mx-auto text-xs text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">
          <SkipForward className="w-3.5 h-3.5" />
          Skip rest
        </button>
      </div>
    </div>
  );
}
