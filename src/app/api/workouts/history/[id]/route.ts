import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const idSchema = z.string().uuid();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) {
    return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
  }

  const workoutLog = await prisma.workoutLog.findUnique({
    where: {
      id: parsedId.data,
    },
    select: {
      id: true,
      userId: true,
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
            select: {
              id: true,
              name: true,
              category: true,
              primaryMuscle: true,
              equipment: true,
            },
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
  });

  if (!workoutLog) {
    return NextResponse.json({ error: 'Workout log not found' }, { status: 404 });
  }

  if (workoutLog.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ workoutLog });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) {
    return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
  }

  const workoutLog = await prisma.workoutLog.findUnique({
    where: { id: parsedId.data },
    select: { userId: true },
  });

  if (!workoutLog) {
    return NextResponse.json({ error: 'Workout log not found' }, { status: 404 });
  }

  if (workoutLog.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.workoutLog.delete({
    where: { id: parsedId.data },
  });

  return NextResponse.json({ success: true });
}
