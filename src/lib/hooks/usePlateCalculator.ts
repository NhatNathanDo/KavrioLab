'use client';

// Standard metric plate sizes in kg (pairs)
const STANDARD_PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25];
const STANDARD_PLATES_LB = [45, 35, 25, 10, 5, 2.5];
const PLATE_COLORS: Record<number, string> = {
  25: '#e74c3c',   // red
  20: '#3498db',   // blue
  15: '#f39c12',   // yellow
  10: '#27ae60',   // green
  5: '#ffffff',    // white
  2.5: '#9b59b6',  // purple
  1.25: '#95a5a6', // grey
  45: '#e74c3c',
  35: '#3498db',
  10.2: '#27ae60',
};

export interface PlateResult {
  plates: Array<{ weight: number; color: string }>;
  eachSide: number;
  barWeight: number;
  targetWeight: number;
  achievable: boolean;
}

export function usePlateCalculator() {
  const calculate = (
    targetWeightKg: number,
    barWeightKg = 20,
    useImperial = false
  ): PlateResult => {
    const plates = useImperial ? STANDARD_PLATES_LB : STANDARD_PLATES_KG;

    // Weight per side
    const eachSide = (targetWeightKg - barWeightKg) / 2;

    if (eachSide <= 0) {
      return {
        plates: [],
        eachSide: 0,
        barWeight: barWeightKg,
        targetWeight: targetWeightKg,
        achievable: eachSide === 0,
      };
    }

    // Greedy allocation
    let remaining = eachSide;
    const selectedPlates: Array<{ weight: number; color: string }> = [];

    for (const plate of plates) {
      while (remaining >= plate - 0.001) {
        selectedPlates.push({
          weight: plate,
          color: PLATE_COLORS[plate] ?? '#aaa',
        });
        remaining -= plate;
        remaining = Math.round(remaining * 1000) / 1000;
      }
    }

    return {
      plates: selectedPlates,
      eachSide,
      barWeight: barWeightKg,
      targetWeight: targetWeightKg,
      achievable: remaining < 0.01,
    };
  };

  return { calculate };
}
