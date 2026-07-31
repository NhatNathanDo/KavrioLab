'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Play, Edit2, Trash2, LayoutTemplate } from 'lucide-react';
import { useWorkoutStore } from '@/lib/stores/useWorkoutStore';
import { Skeleton } from '@/components/ui/skeleton';
import { PageTransition } from '@/components/shared/PageTransition';
import { useTranslation } from '@/components/language-provider';
import ConfirmModal from '@/components/shared/ConfirmModal';

interface TemplateSet {
  id: string;
  setType: 'NORMAL' | 'WARMUP' | 'DROP' | 'FAILURE';
  targetWeightKg: number | null;
  targetReps: number | null;
  orderIndex: number;
}

interface TemplateExercise {
  id: string;
  orderIndex: number;
  exercise: {
    id: string;
    name: string;
    category: string;
  };
  sets: TemplateSet[];
}

interface Template {
  id: string;
  name: string;
  description: string | null;
  updatedAt: string;
  exercises: TemplateExercise[];
}

export default function TemplatesPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { startWorkoutFromTemplate } = useWorkoutStore();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/workout-templates');
      if (!res.ok) {
        throw new Error('Failed to load templates');
      }
      const data = (await res.json()) as { templates: Template[] };
      setTemplates(data.templates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleStart = (template: Template) => {
    const formattedExercises = template.exercises.map((ex) => ({
      exerciseId: ex.exercise.id,
      name: ex.exercise.name,
      sets: ex.sets.map((s) => ({
        setType: s.setType,
        targetWeightKg: s.targetWeightKg,
        targetReps: s.targetReps,
      })),
    }));

    startWorkoutFromTemplate(template.name, formattedExercises);
    router.push('/workouts/active');
  };

  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!deleteTemplateId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/workout-templates/${deleteTemplateId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setTemplates((prev) => prev.filter((t) => t.id !== deleteTemplateId));
      }
    } catch (err) {
      console.error('Failed to delete template:', err);
    } finally {
      setIsDeleting(false);
      setDeleteTemplateId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-7 w-32 rounded-xl" />
            <Skeleton className="h-4 w-48 rounded-lg" />
          </div>
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-5 space-y-4"
            >
              <div className="space-y-2">
                <Skeleton className="h-4 w-32 rounded-lg" />
                <Skeleton className="h-3 w-48 rounded" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-full rounded" />
                <Skeleton className="h-3 w-2/3 rounded" />
              </div>
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-9 flex-1 rounded-xl" />
                <Skeleton className="h-9 w-9 rounded-xl" />
                <Skeleton className="h-9 w-9 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-5">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Error loading templates
          </h2>
          <p className="text-xs text-zinc-400">{error}</p>
        </div>
        <button
          onClick={fetchTemplates}
          className="px-5 py-2.5 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 text-xs font-semibold rounded-xl hover:opacity-90 transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {t('workouts.templatesTitle')}
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              {t('workouts.templatesSubtitle')}
            </p>
          </div>
          <Link
            href="/workouts/templates/new"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 text-xs font-semibold rounded-xl hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0 shadow-sm transition-all duration-150"
          >
            <Plus className="w-4 h-4" />
            {t('workouts.newTemplate')}
          </Link>
        </div>

        {/* Templates list / Grid */}
        {templates.length === 0 ? (
          <div className="bg-white dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-900 rounded-3xl p-8 py-20 text-center space-y-4 shadow-[0_8px_30px_rgb(0,0,0,0.01)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)]">
            <LayoutTemplate className="w-10 h-10 text-zinc-200 dark:text-zinc-800 mx-auto" />
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{t('workouts.noTemplates')}</p>
              <p className="text-xs text-zinc-400 mt-1">{t('workouts.noTemplatesDesc')}</p>
            </div>
            <Link
              href="/workouts/templates/new"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 text-xs font-semibold rounded-xl hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0 shadow-sm transition-all duration-150"
            >
              <Plus className="w-3.5 h-3.5" />
              {t('workouts.createFirst')}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {templates.map((tmp) => (
              <div
                key={tmp.id}
                className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6 flex flex-col justify-between shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:shadow-md hover:border-zinc-350 dark:hover:border-zinc-800 hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                      {tmp.name}
                    </h3>
                    {tmp.description && (
                      <p className="text-xs text-zinc-400 line-clamp-2 mt-0.5">
                        {tmp.description}
                      </p>
                    )}
                  </div>

                  {/* Exercises list summary */}
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">
                      {tmp.exercises.length} {tmp.exercises.length === 1 ? t('workouts.cardExercise') : t('workouts.cardExercises')}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-3 font-medium">
                      {tmp.exercises.map((ex) => ex.exercise.name).join(' · ') || 'No exercises'}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-5 pt-3 border-t border-[var(--border)]">
                  <button
                    onClick={() => handleStart(tmp)}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 text-xs font-semibold rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-sm"
                    aria-label={`Start workout using ${tmp.name}`}
                  >
                    <Play className="w-3 h-3" />
                    {t('workouts.cardStart')}
                  </button>
                  <Link
                    href={`/workouts/templates/${tmp.id}`}
                    className="p-2 border border-zinc-200 dark:border-zinc-855 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    aria-label={`Edit template ${tmp.name}`}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    onClick={() => setDeleteTemplateId(tmp.id)}
                    className="p-2 border border-zinc-200 dark:border-zinc-855 rounded-xl text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                    aria-label={`Delete template ${tmp.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!deleteTemplateId}
        onClose={() => setDeleteTemplateId(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Xóa giáo án mẫu này?"
        description="Hành động này sẽ xóa vĩnh viễn giáo án mẫu này khỏi danh sách của bạn và không thể hoàn tác."
        confirmText="Xóa ngay"
        cancelText="Hủy"
        variant="danger"
      />
    </PageTransition>
  );
}
