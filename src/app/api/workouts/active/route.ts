import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const activeWorkoutSyncSchema = z.object({
  workoutName: z.string().min(1).max(255),
  startedAt: z.string().optional(),
  workoutData: z.record(z.string(), z.any()),
  restTimerTarget: z.string().nullable().optional(),
  restTimerTotal: z.number().int().min(0).max(86400).nullable().optional(),
});

// GET /api/workouts/active — retrieve current ongoing workout session
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const active = await prisma.activeWorkoutSession.findUnique({
    where: { userId: session.user.id },
  });

  if (!active) {
    return NextResponse.json({ active: null, serverNow: new Date().toISOString() });
  }

  const serverNow = new Date();
  const elapsedSeconds = Math.max(0, Math.floor((serverNow.getTime() - active.startedAt.getTime()) / 1000));

  let restTimer = null;
  if (active.restTimerTarget) {
    const targetMs = active.restTimerTarget.getTime();
    const remainingSeconds = Math.max(0, Math.ceil((targetMs - serverNow.getTime()) / 1000));
    restTimer = {
      targetEndTime: active.restTimerTarget.toISOString(),
      totalSeconds: active.restTimerTotal ?? 0,
      remainingSeconds,
      isExpired: serverNow.getTime() >= targetMs,
    };
  }

  return NextResponse.json({
    active: {
      id: active.id,
      workoutName: active.workoutName,
      startedAt: active.startedAt.toISOString(),
      workoutData: active.workoutData,
      restTimer,
      elapsedSeconds,
      updatedAt: active.updatedAt.toISOString(),
    },
    serverNow: serverNow.toISOString(),
  });
}

// POST /api/workouts/active — save/sync ongoing workout session to server
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body: unknown = await request.json();
  const parsed = activeWorkoutSyncSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid active workout payload', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { workoutName, startedAt, workoutData, restTimerTarget, restTimerTotal } = parsed.data;
  const startedAtDate = startedAt ? new Date(startedAt) : new Date();

  const upserted = await prisma.activeWorkoutSession.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      workoutName,
      startedAt: startedAtDate,
      workoutData,
      restTimerTarget: restTimerTarget ? new Date(restTimerTarget) : null,
      restTimerTotal: restTimerTotal ?? null,
    },
    update: {
      workoutName,
      workoutData,
      ...(startedAt ? { startedAt: startedAtDate } : {}),
      ...(restTimerTarget !== undefined
        ? { restTimerTarget: restTimerTarget ? new Date(restTimerTarget) : null }
        : {}),
      ...(restTimerTotal !== undefined ? { restTimerTotal } : {}),
    },
  });

  const serverNow = new Date();
  const elapsedSeconds = Math.max(0, Math.floor((serverNow.getTime() - upserted.startedAt.getTime()) / 1000));

  return NextResponse.json({
    success: true,
    active: {
      id: upserted.id,
      workoutName: upserted.workoutName,
      startedAt: upserted.startedAt.toISOString(),
      workoutData: upserted.workoutData,
      elapsedSeconds,
    },
    serverNow: serverNow.toISOString(),
  });
}

// DELETE /api/workouts/active — remove active workout session (on finish or cancel)
export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await prisma.activeWorkoutSession.deleteMany({
    where: { userId: session.user.id },
  });

  return NextResponse.json({ success: true });
}
