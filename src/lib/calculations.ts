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
