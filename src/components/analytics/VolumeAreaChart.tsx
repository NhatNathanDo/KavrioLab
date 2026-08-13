'use client';

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface VolumeHistoryItem {
  date: string;
  volumeKg: number;
  setsCount: number;
  workoutsCount: number;
}

interface VolumeAreaChartProps {
  data: VolumeHistoryItem[];
  unitLabel: string;
  isVi: boolean;
  formatWeight: (val: number) => string;
}

export default function VolumeAreaChart({
  data,
  unitLabel,
  isVi,
  formatWeight,
}: VolumeAreaChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-zinc-400">
        {isVi ? 'Chưa có dữ liệu khối lượng trong khoảng thời gian này' : 'No volume data for this period'}
      </div>
    );
  }

  return (
    <div className="h-72 md:h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
            </linearGradient>
          </defs>
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
                const item = payload[0].payload as VolumeHistoryItem;
                return (
                  <div className="bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-3.5 py-2 rounded-xl text-xs shadow-xl space-y-1 border border-zinc-800 dark:border-zinc-200">
                    <p className="font-semibold">{item.date}</p>
                    <p className="text-indigo-400 dark:text-indigo-600 font-bold">
                      {formatWeight(item.volumeKg)} {unitLabel}
                    </p>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                      {item.setsCount} {isVi ? 'hiệp' : 'sets'} · {item.workoutsCount} {isVi ? 'buổi tập' : 'workouts'}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="volumeKg"
            stroke="#6366f1"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#volumeGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
