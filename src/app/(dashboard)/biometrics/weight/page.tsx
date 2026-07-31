'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/components/language-provider';
import PortalModal from '@/components/shared/PortalModal';
import { useUnitStore } from '@/lib/stores/useUnitStore';
import { formatWeightValue, getWeightUnitLabel, parseWeightToKg } from '@/lib/units';
import {
  Scale,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  X,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface WeightEntry {
  id: string;
  weightKg: number;
  emaTrendKg: number;
  loggedAt: string;
  notes?: string | null;
}

interface WeightApiResponse {
  range: string;
  stats: {
    latestWeight: number;
    latestEMA: number;
    weeklyTrendDeltaKg: number;
    totalChangeKg: number;
    totalCount: number;
  };
  entries: WeightEntry[];
}

export default function WeightTrackerPage() {
  const { status } = useSession();
  const router = useRouter();
  const { language } = useTranslation();
  const { unitSystem } = useUnitStore();
  const unitLabel = getWeightUnitLabel(unitSystem);

  const [range, setRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d');
  const [data, setData] = useState<WeightApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showLogModal, setShowLogModal] = useState<boolean>(false);
  const [weightInput, setWeightInput] = useState<string>('');
  const [notesInput, setNotesInput] = useState<string>('');
  const [dateInput, setDateInput] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchWeightData = useCallback(async (selectedRange: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/biometrics/weight?range=${selectedRange}`);
      if (res.ok) {
        const json: WeightApiResponse = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error('Error fetching weight data:', e);
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
      fetchWeightData(range);
    }
  }, [status, range, router, fetchWeightData]);

  const handleLogWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawVal = Number.parseFloat(weightInput);
    if (Number.isNaN(rawVal)) return;

    const valKg = parseWeightToKg(rawVal, unitSystem);
    if (valKg < 20 || valKg > 350) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/biometrics/weight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weightKg: valKg,
          notes: notesInput.trim() || undefined,
          loggedAt: dateInput ? new Date(dateInput).toISOString() : new Date().toISOString(),
        }),
      });

      if (res.ok) {
        setShowLogModal(false);
        setWeightInput('');
        setNotesInput('');
        fetchWeightData(range);
      }
    } catch (err) {
      console.error('Error saving weight:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      const res = await fetch(`/api/biometrics/weight?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchWeightData(range);
      }
    } catch (err) {
      console.error('Error deleting entry:', err);
    }
  };

  const rawStats = data?.stats || {
    latestWeight: 0,
    latestEMA: 0,
    weeklyTrendDeltaKg: 0,
    totalChangeKg: 0,
    totalCount: 0,
  };

  const latestWeightDisplay = formatWeightValue(rawStats.latestWeight, unitSystem);
  const latestEMADisplay = formatWeightValue(rawStats.latestEMA, unitSystem);
  const weeklyRateDisplay = formatWeightValue(rawStats.weeklyTrendDeltaKg, unitSystem);
  const totalChangeDisplay = formatWeightValue(rawStats.totalChangeKg, unitSystem);

  const chartEntries = (data?.entries || []).map((e) => ({
    ...e,
    displayWeight: formatWeightValue(e.weightKg, unitSystem),
    displayEMA: formatWeightValue(e.emaTrendKg, unitSystem),
    formattedDate: new Date(e.loggedAt).toLocaleDateString(
      language === 'vi' ? 'vi-VN' : 'en-US',
      { month: 'short', day: 'numeric' }
    ),
  }));

  return (
    <div className="bg-zinc-50/60 dark:bg-zinc-950/40 px-2 py-4 md:px-4 md:py-8 space-y-4 md:space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900/80 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center border border-indigo-500/20 shrink-0">
            <Scale className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {language === 'vi' ? 'Theo dõi cân nặng & Xu hướng EMA' : 'Weight Tracker & EMA Trend'}
            </h1>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {language === 'vi'
                ? 'Lọc nhiễu biến động cân nặng hàng ngày bằng thuật toán trung bình động lũy thừa'
                : 'Filter out daily hydration noise with Exponential Moving Average (EMA) smoothing'}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setShowLogModal(true);
            setWeightInput(latestWeightDisplay > 0 ? String(latestWeightDisplay) : '');
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs hover:opacity-90 transition-all shadow-sm cursor-pointer w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'vi' ? 'Ghi nhận cân nặng' : 'Log Weight'}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {/* Scale Weight */}
        <div className="bg-white dark:bg-zinc-900 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-2">
          <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {language === 'vi' ? 'Cân nặng thực tế' : 'Scale Weight'}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              {latestWeightDisplay > 0 ? `${latestWeightDisplay} ${unitLabel}` : '--'}
            </span>
          </div>
          <p className="text-[10px] md:text-[11px] font-semibold text-zinc-400 italic">
            {language === 'vi' ? 'Số đo cân mới nhất' : 'Latest scale measurement'}
          </p>
        </div>

        {/* EMA Trend Weight */}
        <div className="bg-white dark:bg-zinc-900 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              {language === 'vi' ? 'Xu hướng (EMA)' : 'EMA Trend Weight'}
            </span>
            <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl md:text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
              {latestEMADisplay > 0 ? `${latestEMADisplay} ${unitLabel}` : '--'}
            </span>
          </div>
          <p className="text-[10px] md:text-[11px] font-semibold text-emerald-600/80 dark:text-emerald-400/80">
            {language === 'vi' ? 'Đã lọc nhiễu tích nước' : 'Smoothed trend weight'}
          </p>
        </div>

        {/* Weekly Rate */}
        <div className="bg-white dark:bg-zinc-900 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {language === 'vi' ? 'Tốc độ 7 ngày' : 'Weekly Rate'}
            </span>
            {weeklyRateDisplay > 0 ? (
              <TrendingUp className="w-4 h-4 text-amber-500 shrink-0" />
            ) : (
              <TrendingDown className="w-4 h-4 text-emerald-500 shrink-0" />
            )}
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              {weeklyRateDisplay > 0 ? `+${weeklyRateDisplay}` : weeklyRateDisplay} {unitLabel}
            </span>
            <span className="text-xs font-semibold text-zinc-400">/ wk</span>
          </div>
          <p className="text-[10px] md:text-[11px] font-semibold text-zinc-400">
            {language === 'vi' ? 'Tốc độ thay đổi theo tuần' : '7-day rate of progress'}
          </p>
        </div>

        {/* Total Change */}
        <div className="bg-white dark:bg-zinc-900 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-2">
          <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {language === 'vi' ? 'Tổng chênh lệch' : 'Total Change'}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              {totalChangeDisplay > 0 ? `+${totalChangeDisplay}` : totalChangeDisplay} {unitLabel}
            </span>
          </div>
          <p className="text-[11px] font-semibold text-zinc-400">
            {language === 'vi' ? 'So với mốc đầu tiên' : 'From baseline entry'}
          </p>
        </div>
      </div>

      {/* Main Chart Section */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-6">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-50">
              {language === 'vi' ? 'Biểu đồ tiến trình Cân nặng vs Xu hướng EMA' : 'Weight vs EMA Trend Chart'}
            </h3>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="inline-flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-400" />
                {language === 'vi' ? 'Số đo thực tế' : 'Scale Entries'} ({unitLabel})
              </span>
              <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                <span className="w-3 h-1 rounded-full bg-emerald-500" />
                {language === 'vi' ? 'Đường xu hướng (EMA)' : 'EMA Trend Line'} ({unitLabel})
              </span>
            </div>
          </div>

          {/* Time Range Pills */}
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-2xl border border-zinc-200 dark:border-zinc-700">
            {(['7d', '30d', '90d', '1y', 'all'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all uppercase ${
                  range === r
                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                {r === '7d' ? '7D' : r === '30d' ? '30D' : r === '90d' ? '90D' : r === '1y' ? '1Y' : 'ALL'}
              </button>
            ))}
          </div>
        </div>

        {/* Recharts Visualization Container */}
        {isLoading ? (
          <div className="h-72 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl animate-pulse flex items-center justify-center text-xs font-semibold text-zinc-400">
            {language === 'vi' ? 'Đang tải dữ liệu biểu đồ...' : 'Loading chart data...'}
          </div>
        ) : chartEntries.length === 0 ? (
          <div className="h-72 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center p-6 text-center space-y-3">
            <Scale className="w-10 h-10 text-zinc-300 dark:text-zinc-700" />
            <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">
              {language === 'vi' ? 'Chưa có mốc cân nặng nào được ghi nhận' : 'No weight entries logged yet'}
            </p>
            <button
              onClick={() => setShowLogModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all"
            >
              {language === 'vi' ? 'Ghi mốc cân nặng đầu tiên' : 'Log First Entry'}
            </button>
          </div>
        ) : (
          <div className="h-80 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartEntries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150, 150, 150, 0.15)" />
                <XAxis
                  dataKey="formattedDate"
                  tick={{ fontSize: 11, fill: 'gray' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={['dataMin - 1', 'dataMax + 1']}
                  tick={{ fontSize: 11, fill: 'gray' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const dataPoint = payload[0].payload as any;
                      return (
                        <div className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 p-3 rounded-2xl shadow-xl text-xs space-y-1 font-bold border border-zinc-700 dark:border-zinc-300">
                          <p className="text-[10px] text-zinc-400 dark:text-zinc-600 font-semibold">
                            {new Date(dataPoint.loggedAt).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-emerald-400 dark:text-emerald-600">
                            EMA Trend: {dataPoint.displayEMA} {unitLabel}
                          </p>
                          <p className="text-xs text-zinc-300 dark:text-zinc-700">
                            Scale: {dataPoint.displayWeight} {unitLabel}
                          </p>
                          {dataPoint.notes && (
                            <p className="text-[11px] italic font-normal text-zinc-400 dark:text-zinc-500 pt-1 border-t border-zinc-800 dark:border-zinc-200">
                              "{dataPoint.notes}"
                            </p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter dataKey="displayWeight" fill="#a1a1aa" opacity={0.6} />
                <Line
                  type="monotone"
                  dataKey="displayEMA"
                  stroke="#10b981"
                  strokeWidth={3.5}
                  dot={false}
                  activeDot={{ r: 6, fill: '#10b981' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* History Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-4">
        <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-50">
          {language === 'vi' ? 'Lịch sử mốc cân nặng' : 'Weight Entry History'}
        </h3>

        {chartEntries.length === 0 ? (
          <p className="text-xs text-zinc-400 italic">
            {language === 'vi' ? 'Không có dữ liệu lịch sử' : 'No history entries found'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-semibold">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">{language === 'vi' ? 'Ngày' : 'Date'}</th>
                  <th className="py-3 px-4">{language === 'vi' ? 'Cân thực tế' : 'Scale Weight'} ({unitLabel})</th>
                  <th className="py-3 px-4">{language === 'vi' ? 'Xu hướng (EMA)' : 'EMA Trend'} ({unitLabel})</th>
                  <th className="py-3 px-4">{language === 'vi' ? 'Ghi chú' : 'Notes'}</th>
                  <th className="py-3 px-4 text-right">{language === 'vi' ? 'Thao tác' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {[...chartEntries].reverse().map((entry) => (
                  <tr key={entry.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-zinc-100">
                      {new Date(entry.loggedAt).toLocaleDateString(
                        language === 'vi' ? 'vi-VN' : 'en-US',
                        { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-zinc-800 dark:text-zinc-200">
                      {entry.displayWeight} {unitLabel}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-emerald-600 dark:text-emerald-400">
                      {entry.displayEMA} {unitLabel}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-500 dark:text-zinc-400 italic">
                      {entry.notes || '--'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                        aria-label="Delete entry"
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

      {/* Log Weight Modal */}
      <PortalModal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        maxWidth="md"
        className="space-y-6"
      >
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                  <Scale className="w-4 h-4 text-indigo-500" />
                </div>
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-50">
                  {language === 'vi' ? 'Ghi nhận cân nặng mới' : 'Log Body Weight'}
                </h3>
              </div>
              <button
                onClick={() => setShowLogModal(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLogWeight} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="weight-num-input" className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                  {language === 'vi' ? `Cân nặng (${unitLabel})` : `Weight (${unitLabel})`}
                </label>
                <input
                  id="weight-num-input"
                  type="number"
                  step="0.1"
                  min="20"
                  max="800"
                  required
                  placeholder={unitSystem === 'IMPERIAL' ? 'e.g. 164.2' : 'e.g. 74.5'}
                  autoFocus
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-bold text-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="weight-date-input" className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                  {language === 'vi' ? 'Ngày ghi nhận' : 'Date'}
                </label>
                <input
                  id="weight-date-input"
                  type="date"
                  value={dateInput}
                  onChange={(e) => setDateInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-semibold text-xs text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="weight-notes-input" className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                  {language === 'vi' ? 'Ghi chú (Không bắt buộc)' : 'Notes (Optional)'}
                </label>
                <input
                  id="weight-notes-input"
                  type="text"
                  placeholder={language === 'vi' ? 'Cân buổi sáng sau đi vệ sinh...' : 'Fasted morning weight...'}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-semibold text-xs text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="flex-1 py-3 rounded-2xl font-bold text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                >
                  {language === 'vi' ? 'Hủy' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-2xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all"
                >
                  {isSubmitting ? 'Saving...' : language === 'vi' ? 'Lưu mốc cân' : 'Save Entry'}
                </button>
              </div>
            </form>
      </PortalModal>
    </div>
  );
}
