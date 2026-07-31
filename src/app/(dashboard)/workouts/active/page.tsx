'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, CheckCircle2, X, ChevronDown, ChevronUp, Trash2, Clock } from 'lucide-react';
import { useWorkoutStore } from '@/lib/stores/useWorkoutStore';
import { ExercisePickerDrawer } from '@/components/workout/ExercisePickerDrawer';
import { SetLogRow } from '@/components/workout/SetLogRow';
import { useTranslation } from '@/components/language-provider';
import ConfirmModal from '@/components/shared/ConfirmModal';

const BARBELL_CATEGORIES = ['CHEST', 'BACK', 'LEGS', 'SHOULDERS'];

export default function ActiveWorkoutPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const {
    activeWorkout,
    addExercise,
    removeExercise,
    addSet,
    setWorkoutNotes,
    finishWorkout,
    cancelWorkout,
  } = useWorkoutStore();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collapsedExercises, setCollapsedExercises] = useState<Set<string>>(new Set());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Redirect if no active workout
  useEffect(() => {
    if (!activeWorkout) {
      router.replace('/workouts');
    }
  }, [activeWorkout, router]);

  // Elapsed timer
  useEffect(() => {
    if (!activeWorkout) return;
    const started = new Date(activeWorkout.startedAt).getTime();
    const update = () => {
      setElapsedSeconds(Math.floor((Date.now() - started) / 1000));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [activeWorkout]);

  const toggleCollapse = useCallback((id: string) => {
    setCollapsedExercises((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const formatElapsed = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const handleFinish = async () => {
    if (!activeWorkout) return;
    if (activeWorkout.exercises.length === 0) {
      setError(t('workouts.noExercisesAdded'));
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const completedAt = new Date().toISOString();
      const payload = {
        name: activeWorkout.name,
        startedAt: activeWorkout.startedAt,
        completedAt,
        notes: activeWorkout.notes || undefined,
        exercises: activeWorkout.exercises.map((ex) => ({
          exerciseId: ex.exerciseId,
          orderIndex: ex.orderIndex,
          sets: ex.sets
            .filter((s) => s.completed && s.repsCompleted > 0)
            .map((s) => ({
              setType: s.setType,
              weightKg: s.weightKg,
              repsCompleted: s.repsCompleted,
              rpe: s.rpe,
              completed: s.completed,
            })),
        })).filter((ex) => ex.sets.length > 0),
      };

      if (payload.exercises.length === 0) {
        setError(t('workouts.noExercisesAdded'));
        setSaving(false);
        return;
      }

      const res = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? t('common.errorGeneric' as any));
      }

      finishWorkout();
      router.push('/workouts/history');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (!activeWorkout) return null;

  const totalSets = activeWorkout.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const completedSets = activeWorkout.exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
    0
  );

  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-[var(--bg-card)]/90 backdrop-blur-md border-b border-[var(--border)] px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate">
              {activeWorkout.name}
            </h1>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="flex items-center gap-1 text-[10px] text-zinc-400">
                <Clock className="w-3 h-3" />
                {formatElapsed(elapsedSeconds)}
              </span>
              <span className="text-[10px] text-zinc-400">
                {completedSets}/{totalSets} {t('workouts.set').toLowerCase() + (t('common.locale' as any) === 'en-US' ? 's' : '')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCancelConfirm(true)}
              className="p-2 rounded-xl text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
              aria-label="Cancel workout"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleFinish}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 text-xs font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {saving ? t('workouts.saveTemplate') + '...' : t('workouts.finish')}
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {error && (
          <div className="px-4 py-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Exercise cards */}
        {activeWorkout.exercises.map((ex) => {
          const collapsed = collapsedExercises.has(ex.id);
          const isBarbellEx = BARBELL_CATEGORIES.includes(ex.name.toUpperCase()) ||
            ex.name.toLowerCase().includes('barbell') ||
            ex.name.toLowerCase().includes('squat') ||
            ex.name.toLowerCase().includes('deadlift') ||
            ex.name.toLowerCase().includes('press') ||
            ex.name.toLowerCase().includes('row');

          return (
            <div
              key={ex.id}
              className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
            >
              {/* Exercise header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-150 dark:border-zinc-900">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                    {ex.name}
                  </h3>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    {ex.sets.length} {ex.sets.length === 1 ? t('workouts.set').toLowerCase() : t('workouts.set').toLowerCase() + (t('common.locale' as any) === 'en-US' ? 's' : '')} ·{' '}
                    {ex.sets.filter((s) => s.completed).length} {t('common.locale' as any) === 'vi-VN' ? 'đã hoàn thành' : 'completed'}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => toggleCollapse(ex.id)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    aria-label={collapsed ? 'Expand exercise' : 'Collapse exercise'}
                  >
                    {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeExercise(ex.id)}
                    className="p-1.5 rounded-lg text-zinc-300 dark:text-zinc-700 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                    aria-label="Remove exercise"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Set rows */}
              {!collapsed && (
                <div className="px-4 py-3 space-y-2">
                  {/* Column headers */}
                  <div
                    className="grid text-[9px] font-bold uppercase tracking-widest text-zinc-400 px-3"
                    style={{ gridTemplateColumns: '28px 52px 1fr 1fr 52px 28px' }}
                  >
                    <span>{t('workouts.type')}</span>
                    <span className="text-center">{t('workouts.set')}</span>
                    <span className="text-center">{t('workouts.targetKg')}</span>
                    <span className="text-center">{t('workouts.targetReps')}</span>
                    <span className="text-center">RPE</span>
                    <span />
                  </div>

                  {ex.sets.map((s, idx) => (
                    <SetLogRow
                      key={s.id}
                      exerciseClientId={ex.id}
                      set={s}
                      setNumber={idx + 1}
                      isBarbell={isBarbellEx}
                    />
                  ))}

                  <button
                    type="button"
                    onClick={() => addSet(ex.id)}
                    className="w-full mt-1 py-2 flex items-center justify-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-zinc-400 dark:hover:border-zinc-650 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {t('workouts.addSet')}
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Notes */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl px-6 py-5 shadow-sm">
          <label htmlFor="workoutNotes" className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">
            {t('workouts.notes')}
          </label>
          <textarea
            id="workoutNotes"
            value={activeWorkout.notes}
            onChange={(e) => setWorkoutNotes(e.target.value)}
            placeholder={t('workouts.notesPlaceholder')}
            rows={3}
            className="w-full bg-transparent text-sm text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-300 dark:placeholder:text-zinc-700 resize-none focus:outline-none"
          />
        </div>

        {/* Add exercise CTA */}
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="w-full py-4 flex items-center justify-center gap-2 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 text-sm font-semibold rounded-3xl hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0 duration-150 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          {t('workouts.addExercise')}
        </button>
      </div>

      {/* Exercise picker drawer */}
      <ExercisePickerDrawer
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(id, name) => {
          addExercise(id, name);
          setPickerOpen(false);
        }}
      />

      <ConfirmModal
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={() => {
          cancelWorkout();
          router.push('/workouts');
        }}
        title="Hủy buổi tập hiện tại?"
        description={t('workouts.discardConfirm') || 'Bạn có chắc chắn muốn hủy buổi tập này? Các tập luyện chưa lưu sẽ bị xóa.'}
        confirmText="Hủy buổi tập"
        cancelText="Tiếp tục tập"
        variant="danger"
      />
    </div>
  );
}
