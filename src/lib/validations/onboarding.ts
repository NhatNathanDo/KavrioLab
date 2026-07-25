import { z } from 'zod';

export const onboardingSchema = z.object({
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  birthDate: z.string().refine((val) => !Number.isNaN(Date.parse(val)), {
    message: 'Invalid birth date',
  }),
  heightCm: z.number().min(50).max(300),
  weightKg: z.number().min(20).max(500),
  targetWeightKg: z.number().min(20).max(500),
  activityTier: z.enum([
    'SEDENTARY',
    'LIGHTLY_ACTIVE',
    'MODERATELY_ACTIVE',
    'VERY_ACTIVE',
    'EXTRA_ACTIVE',
  ]),
  unitSystem: z.enum(['METRIC', 'IMPERIAL']),
  goal: z.enum([
    'AGGRESSIVE_LOSS',
    'MODERATE_LOSS',
    'MAINTENANCE',
    'LEAN_GAIN',
    'AGGRESSIVE_GAIN',
  ]),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
