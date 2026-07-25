import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser, createAuditLog } from '@/lib/auth/admin';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id: userId } = await params;

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      _count: {
        select: {
          workoutLogs: true,
          nutritionLogs: true,
          weightLogs: true,
          bodyMeasurements: true,
          progressPhotos: true,
          habits: true,
        },
      },
      workoutLogs: {
        take: 5,
        orderBy: { startedAt: 'desc' },
        select: {
          id: true,
          name: true,
          startedAt: true,
          completedAt: true,
        },
      },
      weightLogs: {
        take: 5,
        orderBy: { loggedAt: 'desc' },
        select: {
          id: true,
          weightKg: true,
          loggedAt: true,
        },
      },
    },
  });

  if (!targetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  await createAuditLog({
    userId: admin.id,
    action: 'DEBUG_USER_INSPECTION',
    targetType: 'User',
    targetId: userId,
    details: `Admin ${admin.email} inspected live system state for user ${targetUser.email}`,
  });

  return NextResponse.json({ user: targetUser });
}
