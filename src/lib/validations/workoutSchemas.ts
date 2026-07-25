import { z } from 'zod';

// ─── Set Schemas ─────────────────────────────────────────────────────────────

export const logSetSchema = z.object({
  setType: z.enum(['NORMAL', 'WARMUP', 'DROP', 'FAILURE']).default('NORMAL'),
  weightKg: z.coerce.number().min(0).max(1000),
  repsCompleted: z.coerce.number().int().min(0).max(999),
  rpe: z.coerce.number().min(1).max(10).optional().nullable(),
  completed: z.boolean().default(false),
});

export type LogSetInput = z.infer<typeof logSetSchema>;

// ─── Exercise in Session ─────────────────────────────────────────────────────

export const addExerciseSchema = z.object({
  exerciseId: z.string().uuid(),
  name: z.string().min(1),
});

export type AddExerciseInput = z.infer<typeof addExerciseSchema>;

// ─── Complete Workout Log ────────────────────────────────────────────────────

export const workoutLogSchema = z.object({
  name: z.string().min(1, 'Workout name is required').max(255),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  notes: z.string().max(2000).optional(),
  exercises: z.array(
    z.object({
      exerciseId: z.string().uuid(),
      orderIndex: z.number().int().min(0),
      sets: z.array(logSetSchema),
    })
  ).min(1, 'At least one exercise is required'),
});

export type WorkoutLogInput = z.infer<typeof workoutLogSchema>;

// ─── Template Schemas ────────────────────────────────────────────────────────

export const workoutTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(255),
  description: z.string().max(1000).optional(),
  exercises: z.array(
    z.object({
      exerciseId: z.string().uuid(),
      orderIndex: z.number().int().min(0),
      sets: z.array(
        z.object({
          setType: z.enum(['NORMAL', 'WARMUP', 'DROP', 'FAILURE']).default('NORMAL'),
          targetWeightKg: z.coerce.number().min(0).max(1000).optional().nullable(),
          targetReps: z.coerce.number().int().min(0).max(999).optional().nullable(),
          orderIndex: z.number().int().min(0),
        })
      ),
    })
  ),
});

export type WorkoutTemplateInput = z.infer<typeof workoutTemplateSchema>;
