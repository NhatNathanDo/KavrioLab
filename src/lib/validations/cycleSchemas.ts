import { z } from 'zod';

export const logPeriodSchema = z.object({
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const logCycleSymptomSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  flowLevel: z.enum(['LIGHT', 'MEDIUM', 'HEAVY', 'SPOTTING']).optional().nullable(),
  symptoms: z.array(z.string()).default([]),
  mood: z.string().optional().nullable(),
  basalBodyTemp: z.number().optional().nullable(),
  ovulationTestResult: z.enum(['NOT_TESTED', 'NEGATIVE', 'POSITIVE']).default('NOT_TESTED'),
  notes: z.string().optional().nullable(),
});

export type LogPeriodInput = z.infer<typeof logPeriodSchema>;
export type LogCycleSymptomInput = z.infer<typeof logCycleSymptomSchema>;
