'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, X, ChevronDown, ChevronUp, Trash2, ArrowLeft, Save } from 'lucide-react';
import { ExercisePickerDrawer } from '@/components/workout/ExercisePickerDrawer';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/components/language-provider';

interface SetInput {
  id: string; // client-side only UUID
  setType: 'NORMAL' | 'WARMUP' | 'DROP' | 'FAILURE';
  targetWeightKg: string;
  targetReps: string;
}

interface ExerciseInput {
  id: string; // client-side only UUID
  exerciseId: string;
  name: string;
  category: string;
  sets: SetInput[];
}

interface TemplateData {
  id: string;
  name: string;
  description: string | null;
  exercises: Array<{
    id: string;
    orderIndex: number;
    exercise: {
      id: string;
      name: string;
      category: string;
    };
    sets: Array<{
      id: string;
      setType: 'NORMAL' | 'WARMUP' | 'DROP' | 'FAILURE';
      targetWeightKg: number | null;
      targetReps: number | null;
      orderIndex: number;
    }>;
  }>;
}

function createDefaultSetInput(prevSet?: SetInput): SetInput {
  return {
    id: crypto.randomUUID(),
    setType: 'NORMAL',
    targetWeightKg: prevSet?.targetWeightKg ?? '',
    targetReps: prevSet?.targetReps ?? '',
  };
}

const SET_TYPE_COLORS: Record<string, string> = {
  NORMAL: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700',
  WARMUP: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  DROP: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  FAILURE: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800',
};

const SET_TYPE_BADGES: Record<string, string> = {
  NORMAL: 'N',
  WARMUP: 'W',
  DROP: 'D',
  FAILURE: 'F',
};

export default function TemplateEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useTranslation();
  const router = useRouter();
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  const isNew = id === 'new';

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [exercises, setExercises] = useState<ExerciseInput[]>([]);
  
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [pickerOpen, setPickerOpen] = useState(false);
  const [collapsedExercises, setCollapsedExercises] = useState<Set<string>>(new Set());
  const [activeTypeMenuId, setActiveTypeMenuId] = useState<string | null>(null);

  // Load existing template data
  useEffect(() => {
    if (isNew) return;

    const loadTemplate = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/workout-templates/${id}`);
        if (!res.ok) {
          throw new Error('Failed to load template data');
        }
        const data = (await res.json()) as { template: TemplateData };
        setName(data.template.name);
        setDescription(data.template.description ?? '');
        
        // Map database template structure to client edit inputs
        const mappedExercises = data.template.exercises.map((ex) => ({
          id: crypto.randomUUID(),
          exerciseId: ex.exercise.id,
          name: ex.exercise.name,
          category: ex.exercise.category,
          sets: ex.sets.map((s) => ({
            id: crypto.randomUUID(),
            setType: s.setType,
            targetWeightKg: s.targetWeightKg !== null ? String(s.targetWeightKg) : '',
            targetReps: s.targetReps !== null ? String(s.targetReps) : '',
          })),
        }));
        setExercises(mappedExercises);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred loading the template');
      } finally {
        setLoading(false);
      }
    };

    loadTemplate();
  }, [id, isNew]);

  const toggleCollapse = (exerciseClientId: string) => {
    setCollapsedExercises((prev) => {
      const next = new Set(prev);
      if (next.has(exerciseClientId)) next.delete(exerciseClientId);
      else next.add(exerciseClientId);
      return next;
    });
  };

  const handleAddExercise = (exerciseId: string, name: string) => {
    setExercises((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        exerciseId,
        name,
        category: 'OTHER',
        sets: [createDefaultSetInput()],
      },
    ]);
    setPickerOpen(false);
  };

  const handleRemoveExercise = (exerciseClientId: string) => {
    setExercises((prev) => prev.filter((ex) => ex.id !== exerciseClientId));
  };

  const handleAddSet = (exerciseClientId: string) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseClientId) return ex;
        const lastSet = ex.sets[ex.sets.length - 1];
        return {
          ...ex,
          sets: [...ex.sets, createDefaultSetInput(lastSet)],
        };
      })
    );
  };

  const handleUpdateSet = (
    exerciseClientId: string,
    setClientId: string,
    updates: Partial<SetInput>
  ) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseClientId) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s) => (s.id === setClientId ? { ...s, ...updates } : s)),
        };
      })
    );
  };

  const handleRemoveSet = (exerciseClientId: string, setClientId: string) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseClientId) return ex;
        // Keep at least one set
        if (ex.sets.length <= 1) return ex;
        return {
          ...ex,
          sets: ex.sets.filter((s) => s.id !== setClientId),
        };
      })
    );
  };

  const handleSave = async () => {
    setError(null);
    if (!name.trim()) {
      setError('Template name is required.');
      return;
    }

    if (exercises.length === 0) {
      setError('Add at least one exercise.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        exercises: exercises.map((ex, exIdx) => ({
          exerciseId: ex.exerciseId,
          orderIndex: exIdx,
          sets: ex.sets.map((s, sIdx) => ({
            setType: s.setType,
            targetWeightKg: s.targetWeightKg ? Number(s.targetWeightKg) : null,
            targetReps: s.targetReps ? Number.parseInt(s.targetReps, 10) : null,
            orderIndex: sIdx,
          })),
        })),
      };

      const url = isNew ? '/api/workout-templates' : `/api/workout-templates/${id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? 'Failed to save template');
      }

      router.push('/workouts/templates');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8 animate-pulse">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-28 rounded-lg" />
          <Skeleton className="h-9 w-20 rounded-xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-14 w-full rounded-3xl" />
          <Skeleton className="h-14 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/workouts/templates"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {t('workouts.back')}
        </Link>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 text-xs font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all shadow-sm hover:-translate-y-0.5 active:translate-y-0 duration-150"
        >
          <Save className="w-3.5 h-3.5" />
          {saving ? t('workouts.saveTemplate') + '...' : t('workouts.saveTemplate')}
        </button>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {isNew ? t('workouts.editorCreateTitle') : t('workouts.editorEditTitle')}
        </h1>
        <p className="text-xs text-zinc-400">
          {t('workouts.editorDesc')}
        </p>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-650 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Info Fields */}
      <div className="space-y-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
        <div className="space-y-1.5">
          <label htmlFor="templateName" className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            {t('workouts.routineName')}
          </label>
          <input
            id="templateName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('workouts.placeholder')}
            className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-855 rounded-xl text-sm text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="templateDescription" className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            {t('workouts.routineDescription')}
          </label>
          <textarea
            id="templateDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('workouts.descriptionPlaceholder')}
            rows={3}
            className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-855 rounded-xl text-sm text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 resize-none focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700"
          />
        </div>
      </div>

      {/* Structured Exercises */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">{t('workouts.cardExercises')}</h3>

        {exercises.length === 0 ? (
          <div className="py-12 border border-dashed border-zinc-250 dark:border-zinc-850 rounded-3xl text-center space-y-3">
            <p className="text-xs text-zinc-400">{t('workouts.noExercisesAdded')}</p>
            <button
              onClick={() => setPickerOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-xs font-semibold rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            >
              {t('workouts.addExercise')}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {exercises.map((ex, exIdx) => {
              const collapsed = collapsedExercises.has(ex.id);
              return (
                <div
                  key={ex.id}
                  className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                        {ex.name}
                      </h4>
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        {t('workouts.cardExercise')} {exIdx + 1} · {ex.sets.length} {ex.sets.length === 1 ? t('workouts.set').toLowerCase() : t('workouts.set').toLowerCase() + (t('common.locale' as any) === 'en-US' ? 's' : '')}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleCollapse(ex.id)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        aria-label={collapsed ? 'Expand exercise' : 'Collapse exercise'}
                      >
                        {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleRemoveExercise(ex.id)}
                        className="p-1.5 rounded-lg text-zinc-350 dark:text-zinc-700 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                        aria-label={`Remove ${ex.name} from routine`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Set Rows */}
                  {!collapsed && (
                    <div className="px-5 py-4 space-y-2">
                      <div
                        className="grid text-[9px] font-bold uppercase tracking-widest text-zinc-400 px-3"
                        style={{ gridTemplateColumns: '36px 72px 1fr 1fr 28px' }}
                      >
                        <span>{t('workouts.set')}</span>
                        <span>{t('workouts.type')}</span>
                        <span className="text-center">{t('workouts.targetKg')}</span>
                        <span className="text-center">{t('workouts.targetReps')}</span>
                        <span />
                      </div>

                      <div className="space-y-1.5">
                        {ex.sets.map((set, sIdx) => (
                          <div
                            key={set.id}
                            className="grid items-center px-3 py-1.5 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-xl"
                            style={{ gridTemplateColumns: '36px 72px 1fr 1fr 28px' }}
                          >
                            <span className="text-[11px] font-semibold font-mono text-zinc-400">
                              {sIdx + 1}
                            </span>
                            
                            {/* Custom Badge Type Popover Trigger */}
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setActiveTypeMenuId(activeTypeMenuId === set.id ? null : set.id)}
                                className={`h-6 px-2 rounded-md text-[10px] font-bold flex items-center gap-1 border transition-colors ${SET_TYPE_COLORS[set.setType] || SET_TYPE_COLORS.NORMAL}`}
                              >
                                <span>{SET_TYPE_BADGES[set.setType] || 'N'}</span>
                                <ChevronDown className="w-2.5 h-2.5 opacity-60" />
                              </button>

                              {activeTypeMenuId === set.id && (
                                <div className="absolute left-0 top-7 z-30 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden py-1">
                                  <div className="px-3 py-1.5 border-b border-zinc-100 dark:border-zinc-800">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                      {t('workouts.setTypesTitle')}
                                    </p>
                                  </div>
                                  {(['NORMAL', 'WARMUP', 'DROP', 'FAILURE'] as const).map((type) => {
                                    const key = type.toLowerCase() as 'normal' | 'warmup' | 'drop' | 'failure';
                                    const badge = t(`workouts.setTypes.${key}.badge`);
                                    const nameStr = t(`workouts.setTypes.${key}.name`);
                                    return (
                                      <button
                                        key={type}
                                        type="button"
                                        onClick={() => {
                                          handleUpdateSet(ex.id, set.id, { setType: type });
                                          setActiveTypeMenuId(null);
                                        }}
                                        className={`w-full px-3 py-2 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-colors flex items-center gap-2 ${
                                          set.setType === type ? 'bg-zinc-50/80 dark:bg-zinc-800/50' : ''
                                        }`}
                                      >
                                        <span className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center shrink-0 border ${SET_TYPE_COLORS[type]}`}>
                                          {badge}
                                        </span>
                                        <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
                                          {nameStr}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            <div className="flex justify-center px-1">
                              <input
                                type="number"
                                value={set.targetWeightKg}
                                onChange={(e) =>
                                  handleUpdateSet(ex.id, set.id, { targetWeightKg: e.target.value })
                                }
                                placeholder="--"
                                className="w-16 px-2 py-1 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold font-mono text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-300 focus:outline-none"
                              />
                            </div>

                            <div className="flex justify-center px-1">
                              <input
                                type="number"
                                value={set.targetReps}
                                onChange={(e) =>
                                  handleUpdateSet(ex.id, set.id, { targetReps: e.target.value })
                                }
                                placeholder="--"
                                className="w-16 px-2 py-1 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold font-mono text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-300 focus:outline-none"
                              />
                            </div>

                            <div className="flex justify-end">
                              <button
                                onClick={() => handleRemoveSet(ex.id, set.id)}
                                disabled={ex.sets.length <= 1}
                                className="p-1 rounded text-zinc-300 dark:text-zinc-700 hover:text-red-500 disabled:opacity-30 transition-colors"
                                aria-label={`Remove set ${sIdx + 1}`}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddSet(ex.id)}
                        className="w-full mt-2 py-2 flex items-center justify-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 border border-dashed border-zinc-200 dark:border-zinc-850 rounded-xl hover:border-zinc-350 dark:hover:border-zinc-750 transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {t('workouts.addSet')}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Add exercise trigger */}
        <button
          onClick={() => setPickerOpen(true)}
          className="w-full py-4 flex items-center justify-center gap-2 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 text-sm font-semibold rounded-3xl hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0 duration-150 transition-all shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {t('workouts.addExercise')}
        </button>
      </div>

      <ExercisePickerDrawer
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleAddExercise}
      />
    </div>
  );
}

