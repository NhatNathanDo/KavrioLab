import { z } from 'zod';

export const CreateWeightLogSchema = z.object({
  weightKg: z
    .number()
    .min(20, { message: 'Weight must be at least 20kg' })
    .max(350, { message: 'Weight must be at most 350kg' }),
  notes: z.string().optional().nullable(),
  loggedAt: z.string().optional(),
});

export type CreateWeightLogInput = z.infer<typeof CreateWeightLogSchema>;

export const CreateBodyMeasurementSchema = z.object({
  chestCm: z.number().min(0).max(300).optional().nullable(),
  waistCm: z.number().min(0).max(300).optional().nullable(),
  hipsCm: z.number().min(0).max(300).optional().nullable(),
  bicepsCm: z.number().min(0).max(300).optional().nullable(),
  thighsCm: z.number().min(0).max(300).optional().nullable(),
  calvesCm: z.number().min(0).max(300).optional().nullable(),
  shouldersCm: z.number().min(0).max(300).optional().nullable(),
  neckCm: z.number().min(0).max(300).optional().nullable(),
  forearmsCm: z.number().min(0).max(300).optional().nullable(),
  notes: z.string().optional().nullable(),
  loggedAt: z.string().optional(),
});

export type CreateBodyMeasurementInput = z.infer<typeof CreateBodyMeasurementSchema>;

export const CreateProgressPhotoSchema = z.object({
  imageUrl: z.string().min(1, { message: 'Image payload is required' }),
  angle: z.enum(['FRONT', 'SIDE', 'BACK']).default('FRONT'),
  notes: z.string().optional().nullable(),
  loggedAt: z.string().optional(),
});

export type CreateProgressPhotoInput = z.infer<typeof CreateProgressPhotoSchema>;

export const CreateWaterLogSchema = z.object({
  amountMl: z.number().min(50, { message: 'Intake must be at least 50ml' }).max(5000, { message: 'Intake cannot exceed 5000ml' }),
  loggedAt: z.string().optional(),
});

export type CreateWaterLogInput = z.infer<typeof CreateWaterLogSchema>;

export const CreateSleepLogSchema = z.object({
  durationHours: z.number().min(0.5, { message: 'Sleep duration must be at least 30 minutes' }).max(24, { message: 'Sleep duration cannot exceed 24 hours' }),
  qualityScore: z.number().min(1).max(100).default(80),
  bedtime: z.string().optional().nullable(),
  wakeTime: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  loggedAt: z.string().optional(),
});

export type CreateSleepLogInput = z.infer<typeof CreateSleepLogSchema>;



