import { describe, it, expect } from 'vitest';
import { calculateInitialTargets, calculateAge } from '../../src/lib/calculations';
import { OnboardingInput } from '../../src/lib/validations/onboarding';

describe('Biometric calculations test', () => {
  it('should calculate age correctly', () => {
    const birthday = new Date('1995-07-10');
    const age = calculateAge(birthday);
    expect(age).toBeGreaterThanOrEqual(30);
  });

  it('should calculate BMR and calories correctly for Male target', () => {
    const data: OnboardingInput = {
      gender: 'MALE',
      birthDate: '1995-01-01',
      heightCm: 180,
      weightKg: 80,
      targetWeightKg: 75,
      activityTier: 'MODERATELY_ACTIVE',
      unitSystem: 'METRIC',
      goal: 'MODERATE_LOSS',
    };

    const targets = calculateInitialTargets(data);
    expect(targets.calories).toBeGreaterThan(1500);
    expect(targets.protein).toBe(160);
  });
});
