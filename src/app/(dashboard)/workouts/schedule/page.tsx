'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import PortalModal from '@/components/shared/PortalModal';
import { CalendarDays, Plus, X, ChevronRight, Dumbbell, Play, Trash2, GripVertical } from 'lucide-react';
import { useWorkoutStore } from '@/lib/stores/useWorkoutStore';
import { Skeleton } from '@/components/ui/skeleton';
import { PageTransition } from '@/components/shared/PageTransition';
import { useTranslation } from '@/components/language-provider';
import { dictionaries } from '@/lib/translations/dictionaries';

const DAYS = [0, 1, 2, 3, 4, 5, 6] as const;

interface ScheduleTemplate {
  id: string;
  name: string;
  description: string | null;
  exercises: { id: string }[];
}

interface ScheduleEntry {
  dayOfWeek: number;
  template: ScheduleTemplate;
}

interface Template {
  id: string;
  name: string;
  description: string | null;
  exercises: { id: string; exercise: { id: string; name: string; category: string }; sets: unknown[] }[];
}

export default function SchedulePage() {
  const { t, language } = useTranslation();
  const router = useRouter();
  const { startWorkoutFromTemplate } = useWorkoutStore();
  const dayLabels = dictionaries[language].workouts.scheduleDays as unknown as Record<number, string>;

  const [schedule, setSchedule] = useState<Record<number, ScheduleTemplate | null>>({
    0: null, 1: null, 2: null, 3: null, 4: null, 5: null, 6: null,
  });
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickerDay, setPickerDay] = useState<number | null>(null);
  const [saving, setSaving] = useState<number | null>(null);
  const [draggedDay, setDraggedDay] = useState<number | null>(null);
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [schedRes, tplRes] = await Promise.all([
        fetch('/api/workout-schedule'),
        fetch('/api/workout-templates'),
      ]);

      if (schedRes.ok) {
        const { schedules } = (await schedRes.json()) as { schedules: ScheduleEntry[] };
        const map: Record<number, ScheduleTemplate | null> = { 0: null, 1: null, 2: null, 3: null, 4: null, 5: null, 6: null };
        for (const s of schedules) {
          map[s.dayOfWeek] = s.template;
        }
        setSchedule(map);
      }

      if (tplRes.ok) {
        const { templates: tpls } = (await tplRes.json()) as { templates: Template[] };
        setTemplates(tpls);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const assignTemplate = async (dayOfWeek: number, templateId: string) => {
    setSaving(dayOfWeek);
    try {
      const res = await fetch('/api/workout-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayOfWeek, templateId }),
      });
      if (res.ok) {
        const tpl = templates.find((t) => t.id === templateId);
        if (tpl) {
          setSchedule((prev) => ({
            ...prev,
            [dayOfWeek]: { id: tpl.id, name: tpl.name, description: tpl.description, exercises: tpl.exercises.map((e) => ({ id: e.id })) },
          }));
        }
      }
    } finally {
      setSaving(null);
      setPickerDay(null);
    }
  };

  const removeAssignment = async (dayOfWeek: number) => {
    setSaving(dayOfWeek);
    try {
      await fetch(`/api/workout-schedule?day=${dayOfWeek}`, { method: 'DELETE' });
      setSchedule((prev) => ({ ...prev, [dayOfWeek]: null }));
    } finally {
      setSaving(null);
    }
  };

  const handleDrop = async (targetDay: number) => {
    if (draggedDay === null || draggedDay === targetDay) {
      setDragOverDay(null);
      setDraggedDay(null);
      return;
    }
    const sourceDay = draggedDay;
    setDraggedDay(null);
    setDragOverDay(null);

    const sourceTpl = schedule[sourceDay];
    const targetTpl = schedule[targetDay];
    if (!sourceTpl) return;

    // Optimistic UI update
    setSchedule((prev) => ({
      ...prev,
      [targetDay]: sourceTpl,
      [sourceDay]: targetTpl,
    }));

    // Persist API
    await assignTemplate(targetDay, sourceTpl.id);
    if (targetTpl) {
      await assignTemplate(sourceDay, targetTpl.id);
    } else {
      await removeAssignment(sourceDay);
    }
  };

  const startDay = (day: number) => {
    const tpl = schedule[day];
    if (!tpl) return;
    const fullTpl = templates.find((t) => t.id === tpl.id);
    if (!fullTpl) return;
    const formattedExercises = fullTpl.exercises.map((ex) => ({
      exerciseId: ex.exercise.id,
      name: ex.exercise.name,
      sets: (ex.sets as { setType: 'NORMAL' | 'WARMUP' | 'DROP' | 'FAILURE'; targetWeightKg: number | null; targetReps: number | null }[]).map((s) => ({
        setType: s.setType,
        targetWeightKg: s.targetWeightKg,
        targetReps: s.targetReps,
      })),
    }));
    startWorkoutFromTemplate(fullTpl.name, formattedExercises);
    router.push('/workouts/active');
  };

  const hasAnySchedule = Object.values(schedule).some(Boolean);

  const clearAllSchedule = async () => {
    if (!hasAnySchedule) return;
    setSaving(-1);
    try {
      await fetch('/api/workout-schedule', { method: 'DELETE' });
      setSchedule({ 0: null, 1: null, 2: null, 3: null, 4: null, 5: null, 6: null });
    } finally {
      setSaving(null);
    }
  };

  return (
    <PageTransition>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-indigo-500" />
              <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {t('workouts.scheduleTitle')}
              </h1>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('workouts.scheduleSubtitle')}</p>
          </div>

          {hasAnySchedule && (
            <button
              onClick={clearAllSchedule}
              disabled={saving === -1}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 border border-red-200 dark:border-red-900/40 transition-all duration-150 disabled:opacity-40 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {saving === -1 ? '...' : t('workouts.scheduleRemove') + ' all'}
            </button>
          )}
        </div>

        {/* Drag & Drop Hint */}
        <p className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5">
          <GripVertical className="w-3.5 h-3.5" />
          <span>{language === 'vi' ? 'Kéo thả các ô để sắp xếp lại lịch tập' : 'Drag & drop cards to reorder weekly workout schedule'}</span>
        </p>

        {/* Week Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DAYS.map((d) => (
              <Skeleton key={d} className="h-24 rounded-3xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DAYS.map((day) => {
              const tpl = schedule[day];
              const isSaving = saving === day;
              const isToday = new Date().getDay() === (day === 6 ? 0 : day + 1);
              const isDragOver = dragOverDay === day;

              return (
                <motion.div
                  key={day}
                  layout
                  draggable={Boolean(tpl)}
                  onDragStart={() => setDraggedDay(day)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragOverDay !== day) setDragOverDay(day);
                  }}
                  onDragLeave={() => setDragOverDay(null)}
                  onDrop={() => handleDrop(day)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: day * 0.04 }}
                  className={`relative bg-white dark:bg-zinc-950 border rounded-3xl p-5 shadow-sm transition-all ${
                    isDragOver
                      ? 'border-indigo-500 ring-2 ring-indigo-500/20 scale-[1.02]'
                      : isToday
                        ? 'border-zinc-900 dark:border-zinc-200'
                        : 'border-zinc-200 dark:border-zinc-900'
                  } ${tpl ? 'cursor-grab active:cursor-grabbing' : ''}`}
                >
                  {/* Day label */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5 ${
                      isToday ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-400 dark:text-zinc-500'
                    }`}>
                      {tpl && <GripVertical className="w-3 h-3 text-zinc-300 dark:text-zinc-600" />}
                      {dayLabels[day]}
                      {isToday && (
                        <span className="ml-1 text-[9px] bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-1.5 py-0.5 rounded-full font-bold">
                          TODAY
                        </span>
                      )}
                    </span>

                    {tpl && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startDay(day)}
                          title="Start workout"
                          className="p-1.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-80 transition-opacity cursor-pointer"
                        >
                          <Play className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setPickerDay(day)}
                          title="Change template"
                          className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all cursor-pointer"
                        >
                          <ChevronRight className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => removeAssignment(day)}
                          title="Remove"
                          className="p-1.5 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  {isSaving ? (
                    <div className="h-8 bg-zinc-100 dark:bg-zinc-900 rounded-xl animate-pulse" />
                  ) : tpl ? (
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate">{tpl.name}</p>
                      <div className="flex items-center gap-1.5">
                        <Dumbbell className="w-3 h-3 text-zinc-400" />
                        <span className="text-[11px] text-zinc-400">
                          {tpl.exercises.length} {tpl.exercises.length === 1 ? t('workouts.cardExercise') : t('workouts.cardExercises')}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setPickerDay(day)}
                      className="flex items-center gap-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors group cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                      <span className="text-xs">{t('workouts.scheduleAddWorkout')}</span>
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Template Picker Modal */}
      <PortalModal
        isOpen={pickerDay !== null}
        onClose={() => setPickerDay(null)}
        maxWidth="sm"
        className="!p-0 overflow-hidden"
      >
        {pickerDay !== null && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-900">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{t('workouts.schedulePickerTitle')}</h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {dayLabels[pickerDay]}
                </p>
              </div>
              <button
                onClick={() => setPickerDay(null)}
                className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 text-zinc-500" />
              </button>
            </div>

            {/* Template list */}
            <div className="max-h-72 overflow-y-auto p-3 space-y-1.5">
              {templates.length === 0 ? (
                <div className="py-8 text-center space-y-1">
                  <Dumbbell className="w-6 h-6 text-zinc-300 dark:text-zinc-700 mx-auto" />
                  <p className="text-sm text-zinc-500">{t('workouts.scheduleNoTemplates')}</p>
                  <p className="text-xs text-zinc-400">{t('workouts.scheduleNoTemplatesDesc')}</p>
                </div>
              ) : (
                templates.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => assignTemplate(pickerDay, tpl.id)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors group text-left cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate">{tpl.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Dumbbell className="w-3 h-3 text-zinc-400" />
                        <span className="text-[11px] text-zinc-400">
                          {tpl.exercises.length} {tpl.exercises.length === 1 ? t('workouts.cardExercise') : t('workouts.cardExercises')}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-500 shrink-0 transition-colors" />
                  </button>
                ))
              )}
            </div>
          </>
        )}
      </PortalModal>
    </PageTransition>
  );
}
