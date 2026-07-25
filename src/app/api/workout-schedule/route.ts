import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const upsertSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  templateId: z.string().uuid(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const schedules = await prisma.workoutSchedule.findMany({
    where: { userId: session.user.id },
    include: {
      template: {
        select: {
          id: true,
          name: true,
          description: true,
          exercises: {
            select: { id: true },
          },
        },
      },
    },
    orderBy: { dayOfWeek: 'asc' },
  });

  return NextResponse.json({ schedules });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body: unknown = await request.json();
  const result = upsertSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: 'Invalid data', details: result.error.flatten() }, { status: 400 });
  }

  const { dayOfWeek, templateId } = result.data;

  const schedule = await prisma.workoutSchedule.upsert({
    where: {
      userId_dayOfWeek: { userId: session.user.id, dayOfWeek },
    },
    update: { templateId },
    create: {
      userId: session.user.id,
      dayOfWeek,
      templateId,
    },
    include: {
      template: {
        select: {
          id: true,
          name: true,
          description: true,
          exercises: { select: { id: true } },
        },
      },
    },
  });

  return NextResponse.json({ schedule }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dayParam = searchParams.get('day');

  // If no day param → clear entire week
  if (dayParam === null) {
    await prisma.workoutSchedule.deleteMany({
      where: { userId: session.user.id },
    });
    return new NextResponse(null, { status: 204 });
  }

  const day = Number.parseInt(dayParam, 10);
  if (Number.isNaN(day) || day < 0 || day > 6) {
    return NextResponse.json({ error: 'Invalid day parameter (0–6 required)' }, { status: 400 });
  }

  await prisma.workoutSchedule.deleteMany({
    where: { userId: session.user.id, dayOfWeek: day },
  });

  return new NextResponse(null, { status: 204 });
}
