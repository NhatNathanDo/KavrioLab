'use client';

import React, { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '@/components/language-provider';
import {
  CheckSquare,
  Plus,
  Flame,
  Award,
  X,
  Calendar,
  BarChart3,
  Loader2,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface HabitWithStats {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  frequency: string;
  targetDaysPerWeek: number;
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  completedToday: boolean;
  recentLogs: string[]; // YYYY-MM-DD strings
}

// ─── Heatmap Grid Component ───────────────────────────────────────────────────

function HabitHeatmap({ habit }: { readonly habit: HabitWithStats }) {
  const { t } = useTranslation();
  const logSet = new Set(habit.recentLogs);

  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 363);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const weeks: Date[][] = [];
  const cur = new Date(startDate);
  while (cur <= today) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-[3px]" style={{ minWidth: 'max-content' }}>
        {weeks.map((week, wIdx) => (
          // eslint-disable-next-line react/no-array-index-key
          <div key={wIdx} className="flex flex-col gap-[3px]">
            {week.map((day) => {
              const dateStr = day.toISOString().split('T')[0];
              const isCompleted = logSet.has(dateStr);
              const isFuture = day > today;
              const isToday = dateStr === today.toISOString().split('T')[0];

              let bgClass = '';
              let style: React.CSSProperties | undefined;

              if (isFuture) {
                bgClass = 'bg-zinc-100 dark:bg-zinc-800/30';
              } else if (isCompleted) {
                style = { backgroundColor: habit.color + 'cc' };
              } else if (isToday) {
                bgClass = 'bg-zinc-200 dark:bg-zinc-700 ring-1 ring-indigo-400/50';
              } else {
                bgClass = 'bg-zinc-100 dark:bg-zinc-800';
              }

              return (
                <div
                  key={dateStr}
                  title={dateStr}
                  className={`w-3 h-3 rounded-[2px] transition-all ${bgClass}`}
                  style={style}
                />
              );
            })}
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-semibold mt-2">
        <span>{t('habits.less')}</span>
        <div className="flex gap-1">
          {[0.2, 0.4, 0.6, 0.8, 1].map((opacity) => (
            <div
              key={opacity}
              className="w-3 h-3 rounded-[2px]"
              style={{ backgroundColor: habit.color + Math.round(opacity * 200).toString(16).padStart(2, '0') }}
            />
          ))}
        </div>
        <span>{t('habits.more')}</span>
      </div>
    </div>
  );
}

// ─── Create Habit Modal ────────────────────────────────────────────────────────

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f97316',
  '#eab308', '#22c55e', '#06b6d4', '#3b82f6',
];

interface CreateHabitModalProps {
  readonly onClose: () => void;
  readonly onCreated: () => void;
}

function CreateHabitModal({ onClose, onCreated }: CreateHabitModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [frequency, setFrequency] = useState<'DAILY' | 'WEEKDAYS' | 'WEEKENDS' | 'WEEKLY' | 'CUSTOM'>('DAILY');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);

    const res = await fetch('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), description: description || undefined, color, frequency, targetDaysPerWeek: 7 }),
    });

    setIsSubmitting(false);
    if (res.ok) {
      onCreated();
      onClose();
    }
  };

  const freqOptions = [
    ['DAILY', t('habits.freqDaily')],
    ['WEEKDAYS', t('habits.freqWeekdays')],
    ['WEEKENDS', t('habits.freqWeekends')],
    ['WEEKLY', t('habits.freqWeekly')],
  ] as const;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
            {t('habits.modalTitle')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name */}
          <div className="space-y-1.5">
            <label htmlFor="habit-name" className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">
              {t('habits.nameLabel')}
            </label>
            <input
              id="habit-name"
              type="text"
              placeholder={t('habits.namePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              className="w-full px-4 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label htmlFor="habit-desc" className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">
              {t('habits.descLabel')}
            </label>
            <input
              id="habit-desc"
              type="text"
              placeholder={t('habits.descPlaceholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={300}
              className="w-full px-4 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Color Picker */}
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              {t('habits.colorLabel')}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={c}
                  className={`w-7 h-7 rounded-full transition-all cursor-pointer ${color === c ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900 ring-zinc-900 dark:ring-zinc-100 scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Frequency */}
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              {t('habits.freqLabel')}
            </p>
            <div className="flex gap-1.5 flex-wrap">
              {freqOptions.map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setFrequency(val)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    frequency === val
                      ? 'text-white shadow-sm'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                  style={frequency === val ? { backgroundColor: color } : undefined}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!name.trim() || isSubmitting}
            className="w-full py-3 rounded-2xl font-bold text-sm text-white shadow-lg transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ backgroundColor: color }}
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            <span>{isSubmitting ? t('habits.creating') : t('habits.create')}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function HabitsPage() {
  const { status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const res = await fetch('/api/habits');
      if (!res.ok) throw new Error('Failed to load habits');
      return res.json() as Promise<{ habits: HabitWithStats[] }>;
    },
    enabled: status === 'authenticated',
  });

  const checkMutation = useMutation({
    mutationFn: async ({ habitId, date }: { habitId: string; date: string }) => {
      const res = await fetch('/api/habits/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habitId, date }),
      });
      if (!res.ok) throw new Error('Failed to toggle habit');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (habitId: string) => {
      const res = await fetch(`/api/habits?id=${habitId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete habit');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });

  const todayStr = new Date().toISOString().split('T')[0];

  const handleToggleToday = useCallback((habitId: string) => {
    checkMutation.mutate({ habitId, date: todayStr });
  }, [checkMutation, todayStr]);

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  const habits = data?.habits ?? [];
  const totalCompletedToday = habits.filter((h) => h.completedToday).length;

  return (
    <div className="min-h-screen bg-zinc-50/60 dark:bg-zinc-950/40 p-6 md:p-10 space-y-8 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900/80 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center border border-indigo-500/20">
            <CheckSquare className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {t('habits.title')}
            </h1>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {t('habits.subtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {habits.length > 0 && (
            <div className="px-4 py-2 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-black">
              {totalCompletedToday}/{habits.length} {t('habits.todayOf')}
            </div>
          )}
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('habits.createBtn')}</span>
          </button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20 text-zinc-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span className="text-sm font-semibold">{t('habits.loading')}</span>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && habits.length === 0 && (
        <div className="text-center py-24 space-y-4 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800">
          <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 flex items-center justify-center mx-auto">
            <CheckSquare className="w-8 h-8 text-indigo-400 stroke-[1.5]" />
          </div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {t('habits.emptyTitle')}
          </h3>
          <p className="text-xs text-zinc-400 max-w-xs mx-auto">
            {t('habits.emptyDesc')}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg transition-all cursor-pointer mt-2"
          >
            <Plus className="w-4 h-4" />
            <span>{t('habits.createFirst')}</span>
          </button>
        </div>
      )}

      {/* Habit Cards */}
      {!isLoading && habits.length > 0 && (
        <div className="space-y-6">
          {habits.map((habit) => (
            <div
              key={habit.id}
              className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm overflow-hidden"
            >
              {/* Card Header */}
              <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: habit.color + '20', border: `1px solid ${habit.color}30` }}
                  >
                    <CheckSquare className="w-5 h-5" style={{ color: habit.color }} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                      {habit.name}
                    </h2>
                    {habit.description && (
                      <p className="text-xs text-zinc-400 font-medium mt-0.5">{habit.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {/* Streak badges */}
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-orange-500/10 border border-orange-500/20">
                    <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                    <span className="text-xs font-black text-orange-600 dark:text-orange-400">{habit.currentStreak}</span>
                    <span className="text-[10px] font-bold text-zinc-400">{t('habits.streakDays')}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-yellow-500/10 border border-yellow-500/20">
                    <Award className="w-3.5 h-3.5 text-yellow-500 fill-yellow-400" />
                    <span className="text-xs font-black text-yellow-600 dark:text-yellow-400">{habit.longestStreak}</span>
                    <span className="text-[10px] font-bold text-zinc-400">{t('habits.streakBest')}</span>
                  </div>

                  {/* Today check button */}
                  <button
                    onClick={() => handleToggleToday(habit.id)}
                    disabled={checkMutation.isPending}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
                      habit.completedToday
                        ? 'text-white shadow-md'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                    style={habit.completedToday ? { backgroundColor: habit.color } : undefined}
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>{habit.completedToday ? t('habits.doneToday') : t('habits.checkIn')}</span>
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => deleteMutation.mutate(habit.id)}
                    disabled={deleteMutation.isPending}
                    aria-label="Delete habit"
                    className="p-2 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Heatmap */}
              <div className="px-6 pb-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    {t('habits.heatmapLabel')}
                  </span>
                  <div className="flex items-center gap-3 text-[10px] font-semibold text-zinc-400">
                    <span className="flex items-center gap-1">
                      <BarChart3 className="w-3 h-3" />
                      {habit.totalCompletions} {t('habits.completions')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {habit.frequency.toLowerCase()}
                    </span>
                  </div>
                </div>

                <HabitHeatmap habit={habit} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateHabitModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => queryClient.invalidateQueries({ queryKey: ['habits'] })}
        />
      )}
    </div>
  );
}
