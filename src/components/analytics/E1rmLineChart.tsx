'use client';

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface E1rmHistoryItem {
  date: string;
  workoutName?: string;
  e1rmKg: number;
  weightKg: number;
  reps: number;
}

interface E1rmLineChartProps {
  data: E1rmHistoryItem[];
  unitLabel: string;
  isVi: boolean;
  formatWeight: (val: number) => string;
}

export default function E1rmLineChart({
  data,
  unitLabel,
  isVi,
  formatWeight,
}: E1rmLineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-zinc-400">
        {isVi ? 'Chưa có dữ liệu 1RM ước tính cho bài tập này' : 'No estimated 1RM data for this exercise'}
      </div>
    );
  }

  return (
    <div className="h-72 md:h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-zinc-200 dark:text-zinc-800/60" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10, fill: '#71717a' }}
            dy={8}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10, fill: '#71717a' }}
            tickFormatter={(val) => `${Math.round(val)}`}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as E1rmHistoryItem;
                return (
                  <div className="bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-3.5 py-2 rounded-xl text-xs shadow-xl space-y-1 border border-zinc-800 dark:border-zinc-200">
                    <p className="font-semibold">{item.date}</p>
                    <p className="text-emerald-400 dark:text-emerald-600 font-bold">
                      1RM: {formatWeight(item.e1rmKg)} {unitLabel}
                    </p>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                      {isVi ? 'Tốt nhất:' : 'Best:'} {formatWeight(item.weightKg)} {unitLabel} × {item.reps} reps
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Line
            type="monotone"
            dataKey="e1rmKg"
            stroke="#10b981"
            strokeWidth={3}
            dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#ffffff' }}
            activeDot={{ r: 6, fill: '#059669' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
