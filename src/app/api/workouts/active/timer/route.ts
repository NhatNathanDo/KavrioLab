import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const timerSchema = z.object({
  seconds: z.number().int().min(1).max(86400).optional(),
  clear: z.boolean().optional(),
});

// GET /api/workouts/active/timer — get current active rest timer from server
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const active = await prisma.activeWorkoutSession.findUnique({
    where: { userId: session.user.id },
    select: { restTimerTarget: true, restTimerTotal: true },
  });

  const serverNow = new Date();

  if (!active?.restTimerTarget) {
    return NextResponse.json({
      active: false,
      timeLeft: 0,
      totalSeconds: 0,
      serverNow: serverNow.toISOString(),
    });
  }

  const targetMs = active.restTimerTarget.getTime();
  const remaining = Math.max(0, Math.ceil((targetMs - serverNow.getTime()) / 1000));
  const isExpired = serverNow.getTime() >= targetMs;

  return NextResponse.json({
    active: !isExpired,
    isExpired,
    timeLeft: remaining,
    totalSeconds: active.restTimerTotal ?? 0,
    targetEndTime: active.restTimerTarget.toISOString(),
    serverNow: serverNow.toISOString(),
  });
}

// POST /api/workouts/active/timer — start or clear rest timer on server
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body: unknown = await request.json();
  const parsed = timerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid timer payload', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { seconds, clear } = parsed.data;
  const serverNow = new Date();

  if (clear) {
    await prisma.activeWorkoutSession.updateMany({
      where: { userId: session.user.id },
      data: {
        restTimerTarget: null,
        restTimerTotal: null,
      },
    });

    return NextResponse.json({
      active: false,
      timeLeft: 0,
      totalSeconds: 0,
      serverNow: serverNow.toISOString(),
    });
  }

  if (typeof seconds === 'number') {
    const targetDate = new Date(serverNow.getTime() + seconds * 1000);

    // If an active session exists, update it. If not, create a fallback active session
    await prisma.activeWorkoutSession.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        workoutName: 'Workout',
        workoutData: {},
        restTimerTarget: targetDate,
        restTimerTotal: seconds,
      },
      update: {
        restTimerTarget: targetDate,
        restTimerTotal: seconds,
      },
    });

    return NextResponse.json({
      active: true,
      isExpired: false,
      timeLeft: seconds,
      totalSeconds: seconds,
      targetEndTime: targetDate.toISOString(),
      serverNow: serverNow.toISOString(),
    });
  }

  return NextResponse.json({ error: 'Provide either seconds or clear: true' }, { status: 400 });
}
