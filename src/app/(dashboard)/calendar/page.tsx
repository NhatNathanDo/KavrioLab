'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@/components/language-provider';
import PortalModal from '@/components/shared/PortalModal';
import {
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Flame,
  Droplets,
  CheckSquare,
  Scale,
  CalendarDays,
  Loader2,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface DaySummary {
  workouts: { id: string; name: string }[];
  calories: number | null;
  protein: number | null;
  weightKg: number | null;
  waterMl: number;
  habitsCompleted: number;
}

interface CalendarSummaryResponse {
  year: number;
  month: number;
  days: Record<string, DaySummary>;
}

// ─── Day Cell ─────────────────────────────────────────────────────────────────

interface DayCellProps {
  readonly day: number;
  readonly dateStr: string;
  readonly summary: DaySummary | undefined;
  readonly isToday: boolean;
  readonly isCurrentMonth: boolean;
  readonly onClick: (dateStr: string) => void;
}

function DayCell({ day, dateStr, summary, isToday, isCurrentMonth, onClick }: DayCellProps) {
  const hasWorkout = (summary?.workouts.length ?? 0) > 0;
  const hasNutrition = summary?.calories != null;
  const hasWeight = summary?.weightKg != null;
  const hasWater = (summary?.waterMl ?? 0) > 0;
  const hasHabits = (summary?.habitsCompleted ?? 0) > 0;

  return (
    <button
      onClick={() => onClick(dateStr)}
      className={`relative p-2 rounded-2xl min-h-[80px] flex flex-col items-start gap-1 text-left transition-all cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/60 ${
        isToday
          ? 'bg-indigo-500/10 border-2 border-indigo-500/40 dark:bg-indigo-500/10'
          : 'border border-zinc-100 dark:border-zinc-800/60'
      } ${!isCurrentMonth ? 'opacity-30' : ''}`}
    >
      {/* Day Number */}
      <span
        className={`text-xs font-black w-6 h-6 flex items-center justify-center rounded-full ${
          isToday
            ? 'bg-indigo-600 text-white'
            : 'text-zinc-600 dark:text-zinc-400'
        }`}
      >
        {day}
      </span>

      {/* Indicator Dots */}
      {(hasWorkout || hasNutrition || hasWeight || hasWater || hasHabits) && (
        <div className="flex flex-wrap gap-[3px] mt-auto">
          {hasWorkout && (
            <div className="w-4 h-4 rounded-md bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
              <Dumbbell className="w-2.5 h-2.5 text-indigo-500" />
            </div>
          )}
          {hasNutrition && (
            <div className="w-4 h-4 rounded-md bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
              <Flame className="w-2.5 h-2.5 text-orange-500" />
            </div>
          )}
          {hasWeight && (
            <div className="w-4 h-4 rounded-md bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <Scale className="w-2.5 h-2.5 text-emerald-500" />
            </div>
          )}
          {hasWater && (
            <div className="w-4 h-4 rounded-md bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
              <Droplets className="w-2.5 h-2.5 text-cyan-500" />
            </div>
          )}
          {hasHabits && (
            <div className="w-4 h-4 rounded-md bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
              <CheckSquare className="w-2.5 h-2.5 text-violet-500" />
            </div>
          )}
        </div>
      )}
    </button>
  );
}

// ─── Day Detail Drawer ─────────────────────────────────────────────────────────

interface DayDetailProps {
  readonly dateStr: string;
  readonly summary: DaySummary | undefined;
  readonly onClose: () => void;
}

function DayDetail({ dateStr, summary, onClose }: DayDetailProps) {
  const { t, language } = useTranslation();
  const date = new Date(dateStr + 'T00:00:00');
  const locale = language === 'vi' ? 'vi-VN' : 'en-US';
  const label = date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <PortalModal
      isOpen
      onClose={onClose}
      maxWidth="sm"
      className="space-y-5"
    >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 capitalize">{label}</h3>
          <button onClick={onClose} aria-label="Close" className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer text-xl font-bold">×</button>
        </div>

        {!summary ? (
          <p className="text-sm text-zinc-400 text-center py-4">{t('calendar.noData')}</p>
        ) : (
          <div className="space-y-3">
            {summary.workouts.length > 0 && (
              <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-3">
                <Dumbbell className="w-4 h-4 text-indigo-500 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {summary.workouts.length} {t('calendar.sessions')}
                  </span>
                  <p className="text-[10px] text-zinc-400">
                    {summary.workouts.map((w) => w.name).join(', ')}
                  </p>
                </div>
              </div>
            )}
            {summary.calories != null && (
              <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center gap-3">
                <Flame className="w-4 h-4 text-orange-500 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                    {summary.calories} kcal
                  </span>
                  {summary.protein != null && (
                    <p className="text-[10px] text-zinc-400">Protein: {summary.protein}g</p>
                  )}
                </div>
              </div>
            )}
            {summary.weightKg != null && (
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                <Scale className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {summary.weightKg} kg
                </span>
              </div>
            )}
            {summary.waterMl > 0 && (
              <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center gap-3">
                <Droplets className="w-4 h-4 text-cyan-500 shrink-0" />
                <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">
                  {(summary.waterMl / 1000).toFixed(1)} {t('calendar.waterUnit')}
                </span>
              </div>
            )}
            {summary.habitsCompleted > 0 && (
              <div className="p-3 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center gap-3">
                <CheckSquare className="w-4 h-4 text-violet-500 shrink-0" />
                <span className="text-xs font-bold text-violet-600 dark:text-violet-400">
                  {summary.habitsCompleted} {t('calendar.habitsCompleted')}
                </span>
              </div>
            )}
          </div>
        )}
    </PortalModal>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const { status } = useSession();
  const router = useRouter();
  const { t, language } = useTranslation();

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1); // 1-indexed
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { data, isLoading } = useQuery<CalendarSummaryResponse>({
    queryKey: ['calendar-summary', viewYear, viewMonth],
    queryFn: async () => {
      const res = await fetch(`/api/calendar/summary?year=${viewYear}&month=${viewMonth}`);
      if (!res.ok) throw new Error('Failed to load calendar');
      return res.json();
    },
    enabled: status === 'authenticated',
  });

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  const handlePrev = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNext = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Format month title
  const monthDate = new Date(viewYear, viewMonth - 1, 1);
  const locale = language === 'vi' ? 'vi-VN' : 'en-US';
  const monthTitle = monthDate.toLocaleDateString(locale, { month: 'long', year: 'numeric' });

  // Weekdays header
  const weekdays = language === 'vi' 
    ? ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth - 1, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth - 1, 0).getDate();

  const cells: { day: number; dateStr: string; isCurrentMonth: boolean }[] = [];

  // Prev month filler
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const m = viewMonth === 1 ? 12 : viewMonth - 1;
    const y = viewMonth === 1 ? viewYear - 1 : viewYear;
    cells.push({ day: d, dateStr: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`, isCurrentMonth: false });
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      day: d,
      dateStr: `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      isCurrentMonth: true,
    });
  }
  // Next month filler to complete last row
  const remaining = cells.length % 7 === 0 ? 0 : 7 - (cells.length % 7);
  for (let d = 1; d <= remaining; d++) {
    const m = viewMonth === 12 ? 1 : viewMonth + 1;
    const y = viewMonth === 12 ? viewYear + 1 : viewYear;
    cells.push({ day: d, dateStr: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`, isCurrentMonth: false });
  }

  const todayStr = today.toISOString().split('T')[0];
  const days = data?.days ?? {};

  // Month stats
  const monthWorkouts = Object.values(days).reduce((acc, d) => acc + d.workouts.length, 0);
  const monthCalories = Object.values(days).reduce((acc, d) => acc + (d.calories ?? 0), 0);
  const monthHabits = Object.values(days).reduce((acc, d) => acc + d.habitsCompleted, 0);

  return (
    <div className="min-h-screen bg-zinc-50/60 dark:bg-zinc-950/40 p-6 md:p-10 space-y-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900/80 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center border border-indigo-500/20">
            <CalendarDays className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {t('calendar.title')}
            </h1>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {t('calendar.subtitle')}
            </p>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button onClick={handlePrev} aria-label="Previous month" className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors cursor-pointer">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-base font-black text-zinc-900 dark:text-zinc-100 min-w-[140px] text-center capitalize">
            {monthTitle}
          </span>
          <button onClick={handleNext} aria-label="Next month" className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors cursor-pointer">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Month Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Dumbbell, label: t('calendar.workoutsStat'), value: monthWorkouts, color: 'indigo' },
          { icon: Flame, label: t('calendar.caloriesStat'), value: monthCalories > 0 ? `${(monthCalories / 1000).toFixed(1)}k` : '–', color: 'orange' },
          { icon: CheckSquare, label: t('calendar.habitsStat'), value: monthHabits, color: 'violet' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 text-center space-y-1">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center mx-auto">
              <Icon className="w-4 h-4 text-indigo-500" />
            </div>
            <p className="text-2xl font-black text-zinc-900 dark:text-zinc-50">{value}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{label}</p>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm p-5">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1.5 mb-1.5">
          {weekdays.map((wd) => (
            <div key={wd} className="text-center text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 py-1.5">
              {wd}
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-zinc-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span className="text-sm">{t('calendar.loading')}</span>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1.5">
            {cells.map(({ day, dateStr, isCurrentMonth }) => (
              <DayCell
                key={dateStr}
                day={day}
                dateStr={dateStr}
                summary={days[dateStr]}
                isToday={dateStr === todayStr}
                isCurrentMonth={isCurrentMonth}
                onClick={setSelectedDate}
              />
            ))}
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          {[
            { icon: Dumbbell, label: t('calendar.workoutsLegend'), color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
            { icon: Flame, label: t('calendar.nutritionLegend'), color: 'text-orange-500', bg: 'bg-orange-500/10' },
            { icon: Scale, label: t('calendar.weightLegend'), color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            { icon: Droplets, label: t('calendar.waterLegend'), color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
            { icon: CheckSquare, label: t('calendar.habitsLegend'), color: 'text-violet-500', bg: 'bg-violet-500/10' },
          ].map(({ icon: Icon, label, color, bg }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`w-4 h-4 rounded-md ${bg} flex items-center justify-center`}>
                <Icon className={`w-2.5 h-2.5 ${color}`} />
              </div>
              <span className="text-[10px] font-semibold text-zinc-400">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Day Detail Drawer */}
      {selectedDate && (
        <DayDetail
          dateStr={selectedDate}
          summary={days[selectedDate]}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
}
