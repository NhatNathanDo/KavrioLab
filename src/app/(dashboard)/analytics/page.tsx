'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useUnitStore } from '@/lib/stores/useUnitStore';
import { formatWeightValue, getWeightUnitLabel } from '@/lib/units';
import { useTranslation } from '@/components/language-provider';
import {
  TrendingUp,
  Dumbbell,
  Trophy,
  Activity,
  Calendar,
  Layers,
  Sparkles,
  BarChart3,
  ChevronDown,
  LineChart as LineChartIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface VolumeData {
  volumeHistory: Array<{
    date: string;
    volumeKg: number;
    setsCount: number;
    workoutsCount: number;
  }>;
  muscleDistribution: Array<{
    muscleGroup: string;
    volumeKg: number;
    percentage: number;
  }>;
  summaryMetrics: {
    totalVolumeKg: number;
    totalWorkouts: number;
    totalSets: number;
    topMuscleGroup: string;
  };
}

interface E1rmData {
  exerciseId: string;
  exerciseName: string;
  maxE1rmKg: number;
  latestE1rmKg: number;
  history: Array<{
    date: string;
    e1rmKg: number;
    weightKg: number;
    reps: number;
  }>;
}

interface ExerciseOption {
  id: string;
  name: string;
  muscleGroup: string;
}

export default function AnalyticsPage() {
  const { status } = useSession();
  const router = useRouter();
  const { unitSystem } = useUnitStore();
  const { language, t } = useTranslation();

  const [activeTab, setActiveTab] = useState<'volume' | 'e1rm'>('volume');
  const [range, setRange] = useState<'7d' | '30d' | '3m' | '1y'>('30d');
  const [volumeData, setVolumeData] = useState<VolumeData | null>(null);

  // e1RM state
  const [exercises, setExercises] = useState<ExerciseOption[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');
  const [e1rmData, setE1rmData] = useState<E1rmData | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Fetch volume data
  const fetchVolumeData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/analytics/volume?range=${range}`);
      if (res.ok) {
        const json = await res.json();
        setVolumeData(json);
      }
    } catch (err) {
      console.error('Failed to fetch volume analytics:', err);
    } finally {
      setIsLoading(false);
    }
  }, [range]);

  // Fetch e1RM exercise list & specific exercise history
  const fetchE1rmData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/analytics/e1rm?range=${range}${selectedExerciseId ? `&exerciseId=${selectedExerciseId}` : ''}`
      );
      if (res.ok) {
        const json = await res.json();
        setExercises(json.availableExercises || []);
        if (json.e1rmData) {
          setE1rmData(json.e1rmData);
          if (!selectedExerciseId) {
            setSelectedExerciseId(json.e1rmData.exerciseId);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch e1RM analytics:', err);
    } finally {
      setIsLoading(false);
    }
  }, [range, selectedExerciseId]);

  useEffect(() => {
    if (status === 'authenticated') {
      if (activeTab === 'volume') {
        fetchVolumeData();
      } else {
        fetchE1rmData();
      }
    }
  }, [status, activeTab, fetchVolumeData, fetchE1rmData]);

  const unitLabel = getWeightUnitLabel(unitSystem);

  if (status === 'loading') {
    return (
      <div className="p-6 md:p-10 space-y-8 animate-pulse max-w-7xl mx-auto">
        <div className="h-8 w-64 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-zinc-200 dark:bg-zinc-800 rounded-3xl" />
          ))}
        </div>
        <div className="h-80 bg-zinc-200 dark:bg-zinc-800 rounded-3xl" />
      </div>
    );
  }

  const summary = volumeData?.summaryMetrics;

  return (
    <div className="p-4 md:p-10 space-y-8 max-w-7xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-indigo-500" />
            {(t('analytics.title' as any) || 'Progression & Trend Analytics') as string}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {(t('analytics.desc' as any) || 'Track workout volume load trends, estimated 1RM strength curves, and target muscle distribution.') as string}
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900/80 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 self-start md:self-auto">
          {(['7d', '30d', '3m', '1y'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all cursor-pointer ${
                range === r
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs font-bold'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              {r === '7d'
                ? (language === 'vi' ? '7 ngày' : '7 Days')
                : r === '30d'
                ? (t('analytics.timeRange30' as any) || '30 Days')
                : r === '3m'
                ? (t('analytics.timeRange90' as any) || '90 Days')
                : (t('analytics.timeRange365' as any) || '1 Year')}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
        <button
          onClick={() => setActiveTab('volume')}
          className={`px-4 py-2 text-xs font-bold rounded-2xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'volume'
              ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          {(t('analytics.volumeTab' as any) || 'Volume & Muscle Breakdown') as string}
        </button>

        <button
          onClick={() => setActiveTab('e1rm')}
          className={`px-4 py-2 text-xs font-bold rounded-2xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'e1rm'
              ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          {(t('analytics.e1rmTab' as any) || 'e1RM Strength Projections') as string}
        </button>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Volume */}
        <div className="p-5 bg-white dark:bg-zinc-900/60 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              {(t('analytics.totalVolume' as any) || 'Total Volume') as string}
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Dumbbell className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl md:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
              {summary ? formatWeightValue(summary.totalVolumeKg, unitSystem) : '0'}
            </span>
            <span className="text-xs text-zinc-400 ml-1.5">{unitLabel}</span>
          </div>
        </div>

        {/* Workouts */}
        <div className="p-5 bg-white dark:bg-zinc-900/60 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              {(t('analytics.totalWorkouts' as any) || 'Workouts') as string}
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl md:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
              {summary?.totalWorkouts || 0}
            </span>
            <span className="text-xs text-zinc-400 ml-1.5">{language === 'vi' ? 'buổi tập' : 'sessions'}</span>
          </div>
        </div>

        {/* Total Sets */}
        <div className="p-5 bg-white dark:bg-zinc-900/60 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              {(t('analytics.totalSets' as any) || 'Total Sets') as string}
            </span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl md:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
              {summary?.totalSets || 0}
            </span>
            <span className="text-xs text-zinc-400 ml-1.5">{language === 'vi' ? 'hiệp tập' : 'completed'}</span>
          </div>
        </div>

        {/* Top Target Muscle */}
        <div className="p-5 bg-white dark:bg-zinc-900/60 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              {(t('analytics.topMuscle' as any) || 'Primary Focus') as string}
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100 truncate block">
              {summary?.topMuscleGroup || 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Tab 1: Volume & Muscle Breakdown */}
      {activeTab === 'volume' && (
        <div className="space-y-8">
          {/* Main Volume Chart */}
          <div className="p-6 md:p-8 bg-white dark:bg-zinc-900/60 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-500" />
                {(t('analytics.volumeChartTitle' as any) || 'Training Volume Load History') as string}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {(t('analytics.volumeChartDesc' as any) || 'Accumulated weight moved across all exercises per day') as string}
              </p>
            </div>

            {volumeData && volumeData.volumeHistory.length > 0 ? (
              <div className="h-72 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={volumeData.volumeHistory}>
                    <defs>
                      <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" opacity={0.2} />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#888888' }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#888888' }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-zinc-900 text-white p-3 rounded-2xl text-xs space-y-1 shadow-xl border border-zinc-800">
                              <p className="font-bold text-indigo-400">{d.date}</p>
                              <p className="font-semibold">{formatWeightValue(d.volumeKg, unitSystem)} {unitLabel}</p>
                              <p className="text-zinc-400">{d.setsCount} sets ({d.workoutsCount} sessions)</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area type="monotone" dataKey="volumeKg" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#volumeGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                {(t('analytics.noData' as any) || 'No logged workout volume found for the selected time window.') as string}
              </div>
            )}
          </div>

          {/* Muscle Distribution Breakdown */}
          {volumeData && volumeData.muscleDistribution.length > 0 && (
            <div className="p-6 md:p-8 bg-white dark:bg-zinc-900/60 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  {(t('analytics.muscleChartTitle' as any) || 'Muscle Group Distribution Map') as string}
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {(t('analytics.muscleChartDesc' as any) || 'Percentage of total training volume targeted per muscle group') as string}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                {volumeData.muscleDistribution.map((m) => (
                  <div key={m.muscleGroup} className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-extrabold text-zinc-900 dark:text-zinc-100">{m.muscleGroup}</span>
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{m.percentage}%</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full transition-all duration-300" style={{ width: `${m.percentage}%` }} />
                    </div>
                    <div className="text-[10px] text-zinc-400 text-right">
                      {formatWeightValue(m.volumeKg, unitSystem)} {unitLabel}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: e1RM Strength Projections */}
      {activeTab === 'e1rm' && (
        <div className="space-y-8">
          {/* Exercise Selector */}
          <div className="flex items-center justify-between bg-white dark:bg-zinc-900/60 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <label htmlFor="exercise-e1rm-select" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              {(t('analytics.selectExercise' as any) || 'Select Exercise Target:') as string}
            </label>
            <select
              id="exercise-e1rm-select"
              value={selectedExerciseId}
              onChange={(e) => setSelectedExerciseId(e.target.value)}
              className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-bold px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:outline-none"
            >
              {exercises.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name} ({ex.muscleGroup})
                </option>
              ))}
            </select>
          </div>

          {/* e1RM Progress Chart */}
          <div className="p-6 md:p-8 bg-white dark:bg-zinc-900/60 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <LineChartIcon className="w-5 h-5 text-indigo-500" />
                {(t('analytics.e1rmChartTitle' as any) || 'Estimated 1-Rep Max (e1RM) Progression') as string}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {(t('analytics.e1rmChartDesc' as any) || 'Strength projection computed using Epley & Brzycki formula') as string}
              </p>
            </div>

            {e1rmData && e1rmData.history.length > 0 ? (
              <div className="h-72 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={e1rmData.history}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" opacity={0.2} />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#888888' }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#888888' }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-zinc-900 text-white p-3 rounded-2xl text-xs space-y-1 shadow-xl border border-zinc-800">
                              <p className="font-bold text-indigo-400">{d.date}</p>
                              <p className="font-bold text-sm">e1RM: {formatWeightValue(d.e1rmKg, unitSystem)} {unitLabel}</p>
                              <p className="text-zinc-400">Top Set: {formatWeightValue(d.weightKg, unitSystem)} {unitLabel} × {d.reps} reps</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line type="monotone" dataKey="e1rmKg" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                {(t('analytics.noData' as any) || 'No logged workout volume found for the selected exercise target.') as string}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
