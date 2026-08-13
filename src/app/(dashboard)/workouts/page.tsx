'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, History, LayoutTemplate, Plus, Dumbbell } from 'lucide-react';
import { useWorkoutStore } from '@/lib/stores/useWorkoutStore';
import { useTranslation } from '@/components/language-provider';
import PortalModal from '@/components/shared/PortalModal';

export default function WorkoutsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { activeWorkout, startWorkout } = useWorkoutStore();
  const [showStartModal, setShowStartModal] = useState(false);
  const [workoutName, setWorkoutName] = useState('');

  const handleStart = () => {
    const name = workoutName.trim() || `Workout – ${new Date().toLocaleDateString(t('common.locale' as any) || 'en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`;
    startWorkout(name);
    router.push('/workouts/active');
  };

  return (
    <div className="max-w-2xl mx-auto px-2 py-4 md:px-4 md:py-8 space-y-5 md:space-y-8 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {t('workouts.title')}
        </h1>
        <p className="text-xs md:text-sm text-zinc-400 mt-1">
          {t('workouts.subtitle')}
        </p>
      </div>

      {/* Active workout banner */}
      {activeWorkout && (
        <button
          type="button"
          onClick={() => router.push('/workouts/active')}
          className="w-full text-left cursor-pointer bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-2xl md:rounded-3xl px-4 md:px-6 py-4 md:py-5 flex items-center justify-between shadow-[0_8px_30px_rgb(16,185,129,0.03)] hover:opacity-90 transition-all duration-200"
          aria-label="View active workout in progress"
        >
          <div>
            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
              ● {t('workouts.activeLabel')}
            </p>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mt-1">
              {activeWorkout.name}
            </p>
          </div>
          <Play className="w-5 h-5 text-emerald-500" />
        </button>
      )}

      {/* Quick action cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <button
          type="button"
          onClick={() => setShowStartModal(true)}
          className="group bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6 text-left space-y-4 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:shadow-md hover:border-zinc-350 dark:hover:border-zinc-800 hover:-translate-y-0.5 transition-all duration-200"
        >
          <div className="w-10 h-10 rounded-2xl bg-zinc-900 dark:bg-zinc-50 flex items-center justify-center border border-zinc-800 dark:border-zinc-100 group-hover:scale-105 transition-transform duration-200">
            <Plus className="w-4 h-4 text-white dark:text-zinc-900" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{t('workouts.startWorkout')}</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">{t('workouts.startWorkoutDesc')}</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => router.push('/workouts/templates')}
          className="group bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6 text-left space-y-4 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:shadow-md hover:border-zinc-350 dark:hover:border-zinc-800 hover:-translate-y-0.5 transition-all duration-200"
        >
          <div className="w-10 h-10 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800/80 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
            <LayoutTemplate className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{t('workouts.templates')}</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">{t('workouts.templatesDesc')}</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => router.push('/workouts/history')}
          className="group bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6 text-left space-y-4 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:shadow-md hover:border-zinc-350 dark:hover:border-zinc-800 hover:-translate-y-0.5 transition-all duration-200"
        >
          <div className="w-10 h-10 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800/80 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
            <History className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{t('workouts.history')}</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">{t('workouts.historyDesc')}</p>
          </div>
        </button>
      </div>

      {/* Empty state when no active workout */}
      {!activeWorkout && (
        <div className="bg-white dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-900 rounded-3xl p-8 py-16 text-center space-y-4 shadow-[0_8px_30px_rgb(0,0,0,0.01)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)]">
          <Dumbbell className="w-10 h-10 text-zinc-200 dark:text-zinc-800 mx-auto" />
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{t('workouts.noActiveSession')}</p>
            <p className="text-xs text-zinc-400 mt-1">{t('workouts.noActiveSessionDesc')}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowStartModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 text-xs font-semibold rounded-xl hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0 shadow-sm transition-all duration-150 animate-fade-in"
          >
            <Play className="w-3.5 h-3.5" />
            {t('workouts.startNow')}
          </button>
        </div>
      )}

      {/* Start workout modal */}
      <PortalModal
        isOpen={showStartModal}
        onClose={() => setShowStartModal(false)}
        maxWidth="sm"
        className="space-y-5"
      >
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {t('workouts.modalTitle')}
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">{t('workouts.modalDesc')}</p>
              </div>
              <input
                type="text"
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                placeholder={t('workouts.placeholder')}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-855 rounded-xl text-sm text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-650"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowStartModal(false)}
                  className="flex-1 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                >
                  {t('workouts.cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleStart}
                  className="flex-1 py-2.5 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 text-xs font-semibold rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-sm"
                >
                  {t('workouts.start')}
                </button>
              </div>
      </PortalModal>
    </div>
  );
}
