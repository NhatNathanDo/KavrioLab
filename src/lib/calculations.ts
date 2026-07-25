import { OnboardingInput } from './validations/onboarding';

export function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function calculateInitialTargets(data: OnboardingInput) {
  const { gender, birthDate, heightCm, weightKg, activityTier, goal } = data;
  const birth = new Date(birthDate);
  const age = calculateAge(birth);

  let bmr = 0;
  if (gender === 'MALE') {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  }

  const multipliers: Record<string, number> = {
    SEDENTARY: 1.200,
    LIGHTLY_ACTIVE: 1.375,
    MODERATELY_ACTIVE: 1.550,
    VERY_ACTIVE: 1.725,
    EXTRA_ACTIVE: 1.900,
  };
  const multiplier = multipliers[activityTier] || 1.200;
  const tdee = bmr * multiplier;

  const adjustments: Record<string, number> = {
    AGGRESSIVE_LOSS: -750,
    MODERATE_LOSS: -500,
    MAINTENANCE: 0,
    LEAN_GAIN: 250,
    AGGRESSIVE_GAIN: 500,
  };
  const adjustment = adjustments[goal] || 0;
  const targetCalories = Math.max(1200, Math.round(tdee + adjustment));

  const targetProtein = Math.round(2.0 * weightKg);
  const targetFat = Math.round((targetCalories * 0.25) / 9);
  const targetCarbs = Math.round((targetCalories - (targetProtein * 4 + targetFat * 9)) / 4);

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    calories: targetCalories,
    protein: targetProtein,
    carbs: targetCarbs,
    fat: targetFat,
  };
}

export interface WeightEntryInput {
  id?: string;
  weightKg: number | string;
  loggedAt: Date | string;
  notes?: string | null;
}

export interface WeightEMAResult {
  id?: string;
  weightKg: number;
  emaTrendKg: number;
  loggedAt: string;
  notes?: string | null;
  dayDiffFromPrev?: number;
}

export function calculateWeightEMA(logs: WeightEntryInput[], alpha = 0.10) {
  if (!logs || logs.length === 0) {
    return {
      entries: [],
      latestWeight: 0,
      latestEMA: 0,
      weeklyTrendDeltaKg: 0,
      totalChangeKg: 0,
    };
  }

  const sorted = [...logs].sort(
    (a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime()
  );

  const results: WeightEMAResult[] = [];
  let currentEMA = Number(sorted[0].weightKg);

  for (let i = 0; i < sorted.length; i++) {
    const item = sorted[i];
    const weight = Number(item.weightKg);

    if (i === 0) {
      currentEMA = weight;
      results.push({
        id: item.id,
        weightKg: Number(weight.toFixed(2)),
        emaTrendKg: Number(currentEMA.toFixed(2)),
        loggedAt: new Date(item.loggedAt).toISOString(),
        notes: item.notes,
        dayDiffFromPrev: 0,
      });
    } else {
      const prevDate = new Date(sorted[i - 1].loggedAt).getTime();
      const currDate = new Date(item.loggedAt).getTime();
      const dayDiff = Math.max(0.1, (currDate - prevDate) / (1000 * 60 * 60 * 24));

      const effectiveAlpha = 1 - Math.pow(1 - alpha, dayDiff);
      currentEMA = effectiveAlpha * weight + (1 - effectiveAlpha) * currentEMA;

      results.push({
        id: item.id,
        weightKg: Number(weight.toFixed(2)),
        emaTrendKg: Number(currentEMA.toFixed(2)),
        loggedAt: new Date(item.loggedAt).toISOString(),
        notes: item.notes,
        dayDiffFromPrev: Number(dayDiff.toFixed(1)),
      });
    }
  }

  const latest = results[results.length - 1];
  const first = results[0];

  let weeklyTrendDeltaKg = 0;
  if (results.length > 1) {
    const oldest = results[0];
    const daysSpan = Math.max(1, (new Date(latest.loggedAt).getTime() - new Date(oldest.loggedAt).getTime()) / (1000 * 60 * 60 * 24));
    const totalEmaChange = latest.emaTrendKg - oldest.emaTrendKg;
    weeklyTrendDeltaKg = Number(((totalEmaChange / daysSpan) * 7).toFixed(2));
  }

  const totalChangeKg = Number((latest.emaTrendKg - first.weightKg).toFixed(2));

  return {
    entries: results,
    latestWeight: latest.weightKg,
    latestEMA: latest.emaTrendKg,
    weeklyTrendDeltaKg,
    totalChangeKg,
  };
}

