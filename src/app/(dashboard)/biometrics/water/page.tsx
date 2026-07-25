'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/components/language-provider';
import {
  Droplets,
  Plus,
  Trash2,
  AlertTriangle,
  Sparkles,
  GlassWater,
  CupSoda,
  Flame,
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

interface WaterLog {
  id: string;
  amountMl: number;
  loggedAt: string;
}

interface WeeklyHistoryItem {
  date: string;
  totalMl: number;
  percentage: number;
}

export default function WaterTrackerPage() {
  const { status } = useSession();
  const router = useRouter();
  const { t } = useTranslation();

  const [todayTotalMl, setTodayTotalMl] = useState<number>(0);
  const [targetMl, setTargetMl] = useState<number>(2500);
  const [targetPercentage, setTargetPercentage] = useState<number>(0);
  const [isDehydrated, setIsDehydrated] = useState<boolean>(false);
  const [todayLogs, setTodayLogs] = useState<WaterLog[]>([]);
  const [weeklyHistory, setWeeklyHistory] = useState<WeeklyHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [customMl, setCustomMl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchWaterData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/biometrics/water');
      if (res.ok) {
        const json = await res.json();
        setTodayTotalMl(json.todayTotalMl || 0);
        setTargetMl(json.targetMl || 2500);
        setTargetPercentage(json.targetPercentage || 0);
        setIsDehydrated(json.isDehydrated || false);
        setTodayLogs(json.todayLogs || []);
        setWeeklyHistory(json.weeklyHistory || []);
      }
    } catch (err) {
      console.error('Error fetching water logs:', err);
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
      fetchWaterData();
    }
  }, [status, router, fetchWaterData]);

  const handleAddIntake = async (amount: number) => {
    if (amount <= 0) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/biometrics/water', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountMl: amount }),
      });
      if (res.ok) {
        setCustomMl('');
        fetchWaterData();
      }
    } catch (err) {
      console.error('Error logging intake:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLog = async (id: string) => {
    try {
      const res = await fetch(`/api/biometrics/water?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchWaterData();
      }
    } catch (err) {
      console.error('Error deleting water log:', err);
    }
  };

  // SVG Circular Ring math
  const radius = 85;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (targetPercentage / 100) * circumference;

  return (
    <div className="min-h-screen bg-zinc-50/60 dark:bg-zinc-950/40 p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-white dark:bg-zinc-900/80 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 dark:bg-cyan-500/20 flex items-center justify-center border border-cyan-500/20">
            <Droplets className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {(t('water.title' as any) || 'Water Intake & Hydration Tracker') as string}
            </h1>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {(t('water.desc' as any) || 'Monitor daily water consumption and hydration warnings') as string}
            </p>
          </div>
        </div>
      </div>

      {/* Smart Dehydration Alert Banner */}
      {isDehydrated && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-5 flex items-start gap-3 text-amber-700 dark:text-amber-300">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-extrabold text-sm">Smart Hydration Warning</h4>
            <p className="text-xs font-medium opacity-90">
              {(t('water.dehydrationAlert' as any) || 'Dehydration Warning: You have consumed less than 50% of your daily target past 3pm.') as string}
            </p>
          </div>
        </div>
      )}

      {/* Main Hydration Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Animated Target Progress Ring */}
        <div className="lg:col-span-5 bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm flex flex-col items-center justify-center space-y-6 relative">
          <div className="flex items-center justify-between w-full border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-500" />
              Today's Hydration Progress
            </h3>
            <span className="text-xs font-extrabold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-xl">
              Target: {targetMl} ml
            </span>
          </div>

          {/* SVG Circular Progress Ring */}
          <div className="relative w-56 h-56 flex items-center justify-center my-4">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
              <circle
                cx="100"
                cy="100"
                r={radius}
                className="stroke-zinc-100 dark:stroke-zinc-800"
                strokeWidth="16"
                fill="transparent"
              />
              <circle
                cx="100"
                cy="100"
                r={radius}
                className="stroke-cyan-500 transition-all duration-700 ease-out"
                strokeWidth="16"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            {/* Inner Ring Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-4xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
                {targetPercentage}%
              </span>
              <span className="text-xs font-extrabold text-cyan-600 dark:text-cyan-400 mt-0.5">
                {todayTotalMl} / {targetMl} ml
              </span>
            </div>
          </div>

          {/* Quick Presets Grid */}
          <div className="w-full space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Quick Add Intake
            </span>
            <div className="grid grid-cols-3 gap-3">
              <button
                disabled={isSubmitting}
                onClick={() => handleAddIntake(250)}
                className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-cyan-500/10 hover:border-cyan-500/30 border border-transparent transition-all cursor-pointer group"
              >
                <GlassWater className="w-5 h-5 text-cyan-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">+250 ml</span>
              </button>
              <button
                disabled={isSubmitting}
                onClick={() => handleAddIntake(500)}
                className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-cyan-500/10 hover:border-cyan-500/30 border border-transparent transition-all cursor-pointer group"
              >
                <CupSoda className="w-5 h-5 text-cyan-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">+500 ml</span>
              </button>
              <button
                disabled={isSubmitting}
                onClick={() => handleAddIntake(750)}
                className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-cyan-500/10 hover:border-cyan-500/30 border border-transparent transition-all cursor-pointer group"
              >
                <Flame className="w-5 h-5 text-cyan-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">+750 ml</span>
              </button>
            </div>

            {/* Custom Intake Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const val = Number.parseInt(customMl);
                if (val > 0) handleAddIntake(val);
              }}
              className="flex items-center gap-2 pt-2"
            >
              <input
                type="number"
                placeholder="Custom ml..."
                value={customMl}
                onChange={(e) => setCustomMl(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-bold text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                disabled={isSubmitting || !customMl}
                className="px-4 py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-all disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: 7-Day History Chart + Today's Logs */}
        <div className="lg:col-span-7 space-y-6">
          {/* 7-Day Hydration Bar Chart */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50">
              7-Day Hydration History (ml)
            </h3>
            <div className="h-56 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" stroke="#71717a" fontSize={10} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={10} tickLine={false} />
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
                  <ReferenceLine y={targetMl} stroke="#06b6d4" strokeDasharray="3 3" />
                  <Bar dataKey="totalMl" fill="#06b6d4" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Today's Log History */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50">
              Today's Water Entries
            </h3>
            {todayLogs.length === 0 ? (
              <p className="text-xs text-zinc-400 italic">No water logs for today</p>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {todayLogs.map((log) => (
                  <div key={log.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 font-bold text-xs">
                        <Droplets className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                          +{log.amountMl} ml
                        </span>
                        <p className="text-[10px] text-zinc-400">
                          {new Date(log.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteLog(log.id)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
