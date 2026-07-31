'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/components/language-provider';
import PortalModal from '@/components/shared/PortalModal';
import {
  Moon,
  Plus,
  Trash2,
  X,
  Sparkles,
  Zap,
  Activity,
  Bed,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface SleepLogItem {
  id: string;
  durationHours: number;
  qualityScore: number;
  bedtime: string | null;
  wakeTime: string | null;
  notes: string | null;
  loggedAt: string;
}

export default function SleepAnalyticsPage() {
  const { status } = useSession();
  const router = useRouter();
  const { t } = useTranslation();

  const [history, setHistory] = useState<SleepLogItem[]>([]);
  const [avgDurationHours, setAvgDurationHours] = useState<number>(0);
  const [avgQualityScore, setAvgQualityScore] = useState<number>(0);
  const [recoveryScore, setRecoveryScore] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showLogModal, setShowLogModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form input state
  const [durationHours, setDurationHours] = useState<string>('7.5');
  const [qualityScore, setQualityScore] = useState<number>(85);
  const [bedtime, setBedtime] = useState<string>('23:00');
  const [wakeTime, setWakeTime] = useState<string>('06:30');
  const [notes, setNotes] = useState<string>('');
  const [loggedDate, setLoggedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  const fetchSleepData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/biometrics/sleep');
      if (res.ok) {
        const json = await res.json();
        setHistory(json.history || []);
        setAvgDurationHours(json.avgDurationHours || 0);
        setAvgQualityScore(json.avgQualityScore || 0);
        setRecoveryScore(json.recoveryScore || 0);
      }
    } catch (err) {
      console.error('Error loading sleep logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') {
      fetchSleepData();
    }
  }, [status, router, fetchSleepData]);

  const handleSaveSleep = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/biometrics/sleep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          durationHours: Number.parseFloat(durationHours),
          qualityScore,
          bedtime,
          wakeTime,
          notes: notes.trim() || undefined,
          loggedAt: loggedDate ? new Date(loggedDate).toISOString() : new Date().toISOString(),
        }),
      });

      if (res.ok) {
        setShowLogModal(false);
        setNotes('');
        fetchSleepData();
      }
    } catch (err) {
      console.error('Error logging sleep:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSleep = async (id: string) => {
    try {
      const res = await fetch(`/api/biometrics/sleep?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchSleepData();
      }
    } catch (err) {
      console.error('Error deleting sleep log:', err);
    }
  };

  const chartData = history.slice(0, 14).reverse().map((l) => ({
    date: new Date(l.loggedAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    hours: l.durationHours,
    quality: l.qualityScore,
  }));

  return (
    <div className="min-h-screen bg-zinc-50/60 dark:bg-zinc-950/40 p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-white dark:bg-zinc-900/80 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center border border-indigo-500/20">
            <Moon className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {(t('sleep.title' as any) || 'Sleep & Recovery Analytics') as string}
            </h1>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {(t('sleep.desc' as any) || 'Track sleep duration, subjective quality ratings, and recovery score') as string}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowLogModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs hover:opacity-90 transition-all shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{(t('sleep.logSleep' as any) || 'Log Sleep Session') as string}</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Recovery Score Card */}
        <div className="bg-gradient-to-br from-indigo-900 to-zinc-900 text-white p-6 rounded-3xl border border-indigo-800/50 shadow-xl space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
              {(t('sleep.recoveryScore' as any) || 'Recovery Score') as string}
            </span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black">{recoveryScore}</span>
            <span className="text-xs text-indigo-300 font-extrabold">/ 100</span>
          </div>
          <p className="text-[11px] font-semibold text-indigo-200/80">
            {recoveryScore >= 80 ? 'Optimal Recovery' : recoveryScore >= 60 ? 'Moderate Recovery' : 'Needs Sleep Recovery'}
          </p>
        </div>

        {/* Avg Duration Card */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              {(t('sleep.avgDuration' as any) || '7-Day Avg Sleep') as string}
            </span>
            <Bed className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-zinc-900 dark:text-zinc-50">
              {avgDurationHours}h
            </span>
            <span className="text-xs text-zinc-400 font-semibold">Goal: 8.0h</span>
          </div>
          <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            {avgDurationHours >= 7.5 ? 'On target for optimal performance' : 'Slight sleep debt'}
          </p>
        </div>

        {/* Avg Quality Card */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              {(t('sleep.avgQuality' as any) || '7-Day Avg Quality') as string}
            </span>
            <Activity className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-zinc-900 dark:text-zinc-50">
              {avgQualityScore}%
            </span>
          </div>
          <p className="text-[11px] font-semibold text-zinc-400">
            Based on subjective daily ratings
          </p>
        </div>
      </div>

      {/* Sleep Duration Bar Chart */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-4">
        <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          Sleep Duration & Quality History
        </h3>
        <div className="h-64 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="date" stroke="#71717a" fontSize={10} tickLine={false} />
              <YAxis stroke="#71717a" fontSize={10} tickLine={false} domain={[0, 12]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#09090b',
                  borderColor: '#27272a',
                  borderRadius: '16px',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 'bold',
                }}
              />
              <ReferenceLine y={8.0} stroke="#6366f1" strokeDasharray="3 3" />
              <Bar dataKey="hours" fill="#6366f1" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sleep History Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-4">
        <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-50">
          {(t('sleep.historyTitle' as any) || 'Sleep History Archive') as string}
        </h3>

        {history.length === 0 ? (
          <p className="text-xs text-zinc-400 italic">No sleep sessions logged yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-semibold">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Quality Score</th>
                  <th className="py-3 px-4">Bedtime / Wake</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {history.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-zinc-100">
                      {new Date(log.loggedAt).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-indigo-600 dark:text-indigo-400">
                      {log.durationHours}h
                    </td>
                    <td className="py-3.5 px-4 text-zinc-700 dark:text-zinc-300">{log.qualityScore}/100</td>
                    <td className="py-3.5 px-4 text-zinc-700 dark:text-zinc-300">
                      {log.bedtime || '--'} → {log.wakeTime || '--'}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-400 italic truncate max-w-[160px]">{log.notes || '--'}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDeleteSleep(log.id)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Sleep Modal */}
      <PortalModal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        maxWidth="md"
        className="space-y-6"
      >
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                  <Moon className="w-4 h-4 text-indigo-500" />
                </div>
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-50">
                  Log Sleep Session
                </h3>
              </div>
              <button
                onClick={() => setShowLogModal(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSleep} className="space-y-4">
              {/* Duration Hours */}
              <div className="space-y-1.5">
                <label htmlFor="sleep-duration-input" className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                  Sleep Duration (Hours)
                </label>
                <input
                  id="sleep-duration-input"
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  required
                  autoFocus
                  value={durationHours}
                  onChange={(e) => setDurationHours(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-bold text-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Quality Rating Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                  <span>Quality Score:</span>
                  <span className="text-indigo-500 font-black">{qualityScore} / 100</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={qualityScore}
                  onChange={(e) => setQualityScore(Number.parseInt(e.target.value))}
                  className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              {/* Bedtime & Wake Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="sleep-bedtime-input" className="text-[11px] font-bold uppercase text-zinc-500">Bedtime</label>
                  <input
                    id="sleep-bedtime-input"
                    type="time"
                    value={bedtime}
                    onChange={(e) => setBedtime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="sleep-waketime-input" className="text-[11px] font-bold uppercase text-zinc-500">Wake Time</label>
                  <input
                    id="sleep-waketime-input"
                    type="time"
                    value={wakeTime}
                    onChange={(e) => setWakeTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <label htmlFor="sleep-date-input" className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                  Log Date
                </label>
                <input
                  id="sleep-date-input"
                  type="date"
                  value={loggedDate}
                  onChange={(e) => setLoggedDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-semibold text-xs text-zinc-900 dark:text-zinc-100"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label htmlFor="sleep-notes-input" className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                  Notes (Optional)
                </label>
                <input
                  id="sleep-notes-input"
                  type="text"
                  placeholder="e.g. Deep sleep, woke up energized..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-semibold text-xs text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="flex-1 py-3 rounded-2xl font-bold text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-2xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all"
                >
                  {isSubmitting ? 'Saving...' : 'Save Entry'}
                </button>
              </div>
            </form>
      </PortalModal>
    </div>
  );
}
