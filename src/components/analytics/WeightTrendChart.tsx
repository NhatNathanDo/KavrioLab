'use client';

import React from 'react';
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

interface WeightChartPoint {
  loggedAt: string;
  formattedDate: string;
  displayWeight: number;
  displayEMA: number;
  notes?: string | null;
}

interface WeightTrendChartProps {
  data: WeightChartPoint[];
  unitLabel: string;
  isVi: boolean;
}

export default function WeightTrendChart({
  data,
  unitLabel,
  isVi,
}: WeightTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-zinc-400">
        {isVi ? 'Chưa có dữ liệu cân nặng' : 'No weight data available'}
      </div>
    );
  }

  return (
    <div className="h-80 w-full pt-4">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                const dataPoint = payload[0].payload as WeightChartPoint;
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
          <Scatter dataKey="displayWeight" fill="#a1a1aa" opacity={0.6} shape="circle" />
          <Line
            type="monotone"
            dataKey="displayEMA"
            stroke="#10b981"
            strokeWidth={3.5}
            dot={false}
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
