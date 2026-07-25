'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { onboardingSchema } from '@/lib/validations/onboarding';
import { revalidatePath } from 'next/cache';

export async function saveOnboarding(formData: any) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  const userId = session.user.id;

  const parsed = onboardingSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: 'Invalid form data' };
  }

  const data = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.userProfile.upsert({
        where: { userId },
        update: {
          gender: data.gender,
          birthDate: new Date(data.birthDate),
          heightCm: data.heightCm,
          targetWeightKg: data.targetWeightKg,
          activityTier: data.activityTier,
          unitSystem: data.unitSystem,
        },
        create: {
          userId,
          gender: data.gender,
          birthDate: new Date(data.birthDate),
          heightCm: data.heightCm,
          targetWeightKg: data.targetWeightKg,
          activityTier: data.activityTier,
          unitSystem: data.unitSystem,
        },
      });
    });

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to save onboarding:', error);
    return { success: false, error: error.message || 'Database error' };
  }
}
