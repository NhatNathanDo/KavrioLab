import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const user = await (prisma as any).user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const profile = user.profile || {};

    return NextResponse.json({
      userId,
      email: user.email,
      unitSystem: profile.unitSystem || 'METRIC',
      heightCm: profile.heightCm ? Number(profile.heightCm) : null,
      targetWeightKg: profile.targetWeightKg ? Number(profile.targetWeightKg) : null,
      activityTier: profile.activityTier || 'SEDENTARY',
      gender: profile.gender || null,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();

    const { unitSystem, heightCm, targetWeightKg, activityTier, gender } = body;

    const updated = await (prisma as any).userProfile.upsert({
      where: { userId },
      update: {
        ...(unitSystem ? { unitSystem } : {}),
        ...(heightCm !== undefined ? { heightCm } : {}),
        ...(targetWeightKg !== undefined ? { targetWeightKg } : {}),
        ...(activityTier ? { activityTier } : {}),
        ...(gender ? { gender } : {}),
      },
      create: {
        userId,
        unitSystem: unitSystem || 'METRIC',
        heightCm,
        targetWeightKg,
        activityTier: activityTier || 'SEDENTARY',
        gender,
      },
    });

    return NextResponse.json({
      userId: updated.userId,
      unitSystem: updated.unitSystem,
      heightCm: updated.heightCm ? Number(updated.heightCm) : null,
      targetWeightKg: updated.targetWeightKg ? Number(updated.targetWeightKg) : null,
      activityTier: updated.activityTier,
      gender: updated.gender,
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ error: 'Failed to update user profile' }, { status: 500 });
  }
}
