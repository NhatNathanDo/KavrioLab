import { describe, it, expect } from 'vitest';
import { logSetSchema, workoutTemplateSchema } from '../../src/lib/validations/workoutSchemas';

describe('Workout time-based sets validation tests', () => {
  it('should validate set with timeSeconds correctly (e.g. dead hang or plank)', () => {
    const validSet = {
      setType: 'NORMAL' as const,
      weightKg: 0,
      repsCompleted: 0,
      timeSeconds: 45,
      completed: true,
    };

    const parsed = logSetSchema.safeParse(validSet);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.timeSeconds).toBe(45);
      expect(parsed.data.weightKg).toBe(0);
      expect(parsed.data.repsCompleted).toBe(0);
    }
  });

  it('should validate template set with targetTimeSeconds', () => {
    const validTemplate = {
      name: 'Grip & Core Endurance',
      description: 'Planks and dead hangs for time',
      exercises: [
        {
          exerciseId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          orderIndex: 0,
          sets: [
            {
              setType: 'NORMAL' as const,
              targetWeightKg: 0,
              targetReps: null,
              targetTimeSeconds: 60,
              orderIndex: 0,
            },
            {
              setType: 'FAILURE' as const,
              targetWeightKg: 10,
              targetReps: null,
              targetTimeSeconds: 45,
              orderIndex: 1,
            },
          ],
        },
      ],
    };

    const parsed = workoutTemplateSchema.safeParse(validTemplate);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.exercises[0].sets[0].targetTimeSeconds).toBe(60);
      expect(parsed.data.exercises[0].sets[1].targetTimeSeconds).toBe(45);
      expect(parsed.data.exercises[0].sets[1].targetWeightKg).toBe(10);
    }
  });

  it('should accept null or undefined timeSeconds for traditional weight/rep sets', () => {
    const repSet = {
      setType: 'NORMAL' as const,
      weightKg: 100,
      repsCompleted: 5,
      completed: true,
    };

    const parsed = logSetSchema.safeParse(repSet);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.timeSeconds).toBeUndefined();
      expect(parsed.data.repsCompleted).toBe(5);
    }
  });
});
