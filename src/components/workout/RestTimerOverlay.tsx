'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, SkipForward, Plus, Volume2, VolumeX, CheckCircle2, Minimize2, Maximize2, Timer } from 'lucide-react';
import { useRestTimerStore } from '@/lib/stores/useRestTimerStore';
import { isTimerMuted, setTimerMuted } from '@/lib/utils/timerAudio';
import { useTranslation } from '@/components/language-provider';

const PRESET_DURATIONS = [60, 90, 120, 180];

export function GlobalRestTimer() {
  const {
    isOpen,
    isMinimized,
    isActive,
    isFinished,
    timeLeft,
    totalSeconds,
    start,
    skip,
    minimize,
    maximize,
    syncWithServer,
  } = useRestTimerStore();

  const { t, language } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [muted, setMutedState] = useState(false);

  useEffect(() => {
    setMounted(true);
    setMutedState(isTimerMuted());
    void syncWithServer();
  }, [syncWithServer]);

  if (!mounted) return null;
  if (!isOpen && !isActive && !isFinished) return null;

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !muted;
    setTimerMuted(next);
    setMutedState(next);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = totalSeconds > 0 ? Math.min(1, Math.max(0, timeLeft / totalSeconds)) : 0;

  // Floating Minimized Pill
  if (isMinimized && (isActive || isFinished)) {
    return createPortal(
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] animate-in fade-in slide-in-from-bottom-5 duration-200">
        <div
          role="button"
          tabIndex={0}
          onClick={maximize}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              maximize();
            }
          }}
          className={`flex items-center gap-3 px-4 py-2.5 rounded-full shadow-xl border backdrop-blur-md cursor-pointer transition-all hover:scale-105 active:scale-95 ${
            isFinished
              ? 'bg-emerald-600 border-emerald-500 text-white'
              : 'bg-zinc-900/95 dark:bg-zinc-900/95 border-zinc-800 text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <Timer className={`w-4 h-4 ${isActive ? 'animate-pulse text-emerald-400' : 'text-white'}`} />
            <span className="text-xs font-mono font-bold tabular-nums">
              {isFinished ? (language === 'vi' ? 'Đã xong!' : 'Ready!') : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`}
            </span>
          </div>

          <div className="h-4 w-px bg-white/20" />

          <div className="flex items-center gap-1">
            {!isFinished && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  start(timeLeft + 30);
                }}
                className="px-2 py-0.5 text-[10px] font-semibold bg-white/10 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
                title="+30s"
              >
                +30s
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                skip();
              }}
              className="p-1 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors cursor-pointer"
              title="Skip"
              aria-label="Skip rest"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                maximize();
              }}
              className="p-1 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors cursor-pointer"
              title="Expand"
              aria-label="Expand rest timer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // Full Screen Modal View
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close rest timer"
        className="absolute inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-sm transition-opacity border-none cursor-pointer w-full h-full"
        onClick={skip}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-xs sm:max-w-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-3xl p-6 sm:p-7 shadow-2xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isFinished ? 'bg-emerald-500 animate-ping' : 'bg-emerald-500'}`} />
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {t('workouts.restTimer')}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleMute}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                muted
                  ? 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-850'
                  : 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
              }`}
              title={muted ? (language === 'vi' ? 'Bật âm báo' : 'Unmute timer sound') : (language === 'vi' ? 'Tắt âm báo' : 'Mute timer sound')}
              aria-label="Toggle sound"
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={minimize}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-850 transition-colors cursor-pointer"
              title={language === 'vi' ? 'Thu nhỏ xuống thanh nổi' : 'Minimize to floating pill'}
              aria-label="Minimize"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={skip}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-850 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
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
              className={`transition-all duration-300 ease-linear ${isFinished ? 'text-emerald-400' : 'text-emerald-500'}`}
              stroke="currentColor"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={isFinished ? 0 : strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>

          {/* Time digits / completion status */}
          <div className="absolute flex flex-col items-center justify-center">
            {isFinished ? (
              <div className="flex flex-col items-center animate-in zoom-in-75 duration-200">
                <CheckCircle2 className="w-9 h-9 text-emerald-500 mb-1" />
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  {language === 'vi' ? 'Đã xong!' : 'Ready!'}
                </span>
              </div>
            ) : (
              <>
                <span className="text-4xl font-bold font-mono tracking-tight text-zinc-900 dark:text-zinc-50 tabular-nums">
                  {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </span>
                {totalSeconds > 0 && (
                  <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 mt-1">
                    {totalSeconds}s
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Finish announcement */}
        {isFinished ? (
          <div className="space-y-3">
            <p className="text-xs text-zinc-600 dark:text-zinc-300 font-medium">
              {language === 'vi' ? 'Thời gian nghỉ đã kết thúc. Sẵn sàng cho set tiếp theo!' : 'Rest complete! Time to crush the next set.'}
            </p>
            <button
              type="button"
              onClick={skip}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              {language === 'vi' ? 'Bắt đầu hiệp tiếp' : 'Start Next Set'}
            </button>
          </div>
        ) : (
          <>
            {/* Preset duration buttons */}
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              {PRESET_DURATIONS.map((s) => {
                const label = s < 60 ? `${s}s` : `${s / 60}m`;
                const isSelected = totalSeconds === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => start(s)}
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
                onClick={() => start(timeLeft + 30)}
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
              onClick={skip}
              className="w-full py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <SkipForward className="w-3.5 h-3.5" />
              {t('workouts.skipRest')}
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

// Backward-compatible exports
export function RestTimerOverlay({ onClose }: { initialSeconds?: number; onClose: () => void }) {
  const { skip } = useRestTimerStore();
  return (
    <div
      onClick={() => {
        skip();
        onClose();
      }}
    />
  );
}

export function RestTimerAutoStart({ initialSeconds = 90 }: { initialSeconds?: number; onClose?: () => void }) {
  const { start, isActive } = useRestTimerStore();
  useEffect(() => {
    if (!isActive) {
      start(initialSeconds);
    }
  }, [isActive, start, initialSeconds]);

  return <GlobalRestTimer />;
}
