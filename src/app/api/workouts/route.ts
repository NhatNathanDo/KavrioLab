import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { workoutLogSchema } from '@/lib/validations/workoutSchemas';

// POST /api/workouts — save a completed workout session to DB
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body: unknown = await request.json();
  const parsed = workoutLogSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, startedAt, completedAt, notes, exercises } = parsed.data;

  const workoutLog = await prisma.workoutLog.create({
    data: {
      userId: session.user.id,
      name,
      startedAt: new Date(startedAt),
      completedAt: completedAt ? new Date(completedAt) : undefined,
      notes,
      exercises: {
        create: exercises.map((ex) => ({
          exerciseId: ex.exerciseId,
          orderIndex: ex.orderIndex,
          sets: {
            create: ex.sets.map((s) => ({
              setType: s.setType,
              weightKg: s.weightKg,
              repsCompleted: s.repsCompleted,
              rpe: s.rpe ?? null,
              completed: s.completed,
            })),
          },
        })),
      },
    },
    select: { id: true, name: true, completedAt: true },
  });

  return NextResponse.json({ workoutLog }, { status: 201 });
}

// GET /api/workouts — list recent workouts for the authenticated user
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const take = Math.min(Number(searchParams.get('take') ?? '10'), 50);
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
          select: {
            id: true,
            orderIndex: true,
            exercise: { select: { name: true, category: true } },
            sets: { select: { id: true, weightKg: true, repsCompleted: true, completed: true } },
          },
        },
      },
    }),
    prisma.workoutLog.count({ where: { userId: session.user.id } }),
  ]);

  return NextResponse.json({ workouts, total });
}
