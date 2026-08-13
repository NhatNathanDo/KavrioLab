'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface WaterPoint {
  date: string;
  ml: number;
}

interface WaterChartProps {
  data: WaterPoint[];
  isVi: boolean;
}

export default function WaterChart({ data, isVi }: WaterChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-xs text-zinc-400">
        {isVi ? 'Chưa có dữ liệu lượng nước uống' : 'No water intake data available'}
      </div>
    );
  }

  return (
    <div className="h-56 md:h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
            tickFormatter={(val) => `${val}`}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as WaterPoint;
                return (
                  <div className="bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-3 py-1.5 rounded-xl text-xs shadow-xl space-y-0.5 border border-zinc-800 dark:border-zinc-200">
                    <p className="font-semibold">{item.date}</p>
                    <p className="text-sky-400 dark:text-sky-600 font-bold">
                      {item.ml} ml
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="ml" fill="#38bdf8" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
