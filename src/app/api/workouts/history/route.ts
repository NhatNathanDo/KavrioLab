import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// GET /api/workouts/history — paginated history for the authenticated user
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const take = Math.min(Number(searchParams.get('take') ?? '20'), 100);
  const skip = Number(searchParams.get('skip') ?? '0');

  const [workouts, total] = await prisma.$transaction([
    prisma.workoutLog.findMany({
      where: { userId: session.user.id },
      orderBy: { startedAt: 'desc' },
      take,
      skip,
      select: {
        id: true,
        name: true,
        startedAt: true,
        completedAt: true,
        notes: true,
        exercises: {
          orderBy: { orderIndex: 'asc' },
          select: {
            id: true,
            orderIndex: true,
            exercise: {
              select: { id: true, name: true, category: true, primaryMuscle: true },
            },
            sets: {
              select: {
                id: true,
                setType: true,
                weightKg: true,
                repsCompleted: true,
                rpe: true,
                completed: true,
              },
            },
          },
        },
      },
    }),
    prisma.workoutLog.count({ where: { userId: session.user.id } }),
  ]);

  return NextResponse.json({ workouts, total, skip, take });
}
