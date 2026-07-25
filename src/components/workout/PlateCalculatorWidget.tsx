'use client';

import { usePlateCalculator } from '@/lib/hooks/usePlateCalculator';

interface PlateCalculatorWidgetProps {
  weightKg: number;
  barWeightKg?: number;
}

export function PlateCalculatorWidget({ weightKg, barWeightKg = 20 }: PlateCalculatorWidgetProps) {
  const { calculate } = usePlateCalculator();
  const result = calculate(weightKg, barWeightKg);

  if (weightKg <= barWeightKg || result.plates.length === 0) return null;

  return (
    <div className="mt-2 px-2 py-2 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
      {/* Barbell visual */}
      <div className="flex items-center gap-0.5 overflow-x-auto pb-1 scrollbar-none">
        {/* Left collar */}
        <div className="w-1.5 h-6 bg-zinc-400 dark:bg-zinc-600 rounded-sm flex-shrink-0" />

        {/* Plates left side (reversed for visual) */}
        {[...result.plates].reverse().map((plate, i) => (
          <div
            key={`l-${plate.weight}-${i}`}
            className="rounded-sm flex-shrink-0 flex items-center justify-center text-[7px] font-bold text-white"
            style={{
              backgroundColor: plate.color,
              width: `${Math.max(10, plate.weight / 2)}px`,
              height: `${Math.max(24, Math.min(40, plate.weight * 1.5))}px`,
              border: '1px solid rgba(0,0,0,0.2)',
            }}
          >
            {plate.weight >= 5 ? plate.weight : ''}
          </div>
        ))}

        {/* Bar */}
        <div className="flex-1 min-w-12 h-2 bg-zinc-300 dark:bg-zinc-600 rounded-full" />

        {/* Plates right side */}
        {result.plates.map((plate, i) => (
          <div
            key={`r-${plate.weight}-${i}`}
            className="rounded-sm flex-shrink-0 flex items-center justify-center text-[7px] font-bold text-white"
            style={{
              backgroundColor: plate.color,
              width: `${Math.max(10, plate.weight / 2)}px`,
              height: `${Math.max(24, Math.min(40, plate.weight * 1.5))}px`,
              border: '1px solid rgba(0,0,0,0.2)',
            }}
          >
            {plate.weight >= 5 ? plate.weight : ''}
          </div>
        ))}

        {/* Right collar */}
        <div className="w-1.5 h-6 bg-zinc-400 dark:bg-zinc-600 rounded-sm flex-shrink-0" />
      </div>

      {/* Label */}
      <p className="text-[9px] text-zinc-400 mt-1 text-center">
        {result.eachSide}kg each side · bar {barWeightKg}kg
      </p>
    </div>
  );
}
