import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createHabitSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  icon: z.string().default('CheckSquare'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#6366f1'),
  frequency: z.enum(['DAILY', 'WEEKLY', 'WEEKDAYS', 'WEEKENDS', 'CUSTOM']).default('DAILY'),
  targetDaysPerWeek: z.number().min(1).max(7).default(7),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const habits = await (prisma as any).habit.findMany({
    where: { userId: session.user.id, isArchived: false },
    orderBy: { createdAt: 'asc' },
    include: {
      habitLogs: {
        orderBy: { completedAt: 'desc' },
        take: 365,
      },
    },
  });

  // Calculate streaks for each habit
  const habitsWithStats = habits.map((habit: {
    habitLogs: { completedAt: Date }[];
    [key: string]: unknown;
  }) => {
    const logs: { completedAt: Date }[] = habit.habitLogs;
    const logDates = new Set<string>(
      logs.map((l) => l.completedAt.toISOString().split('T')[0])
    );

    // Current streak
    let currentStreak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      if (logDates.has(dateStr)) {
        currentStreak++;
      } else if (i === 0) {
        // Today not checked yet — keep going
        continue;
      } else {
        break;
      }
    }

    // Longest streak
    const sortedDates = [...logDates].sort((a, b) => a.localeCompare(b));
    let longestStreak = 0;
    let running = 0;
    let prev: Date | null = null;
    for (const dateStr of sortedDates) {
      const cur = new Date(dateStr);
      if (prev) {
        const diff = (cur.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
        running = diff === 1 ? running + 1 : 1;
      } else {
        running = 1;
      }
      if (running > longestStreak) longestStreak = running;
      prev = cur;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const completedToday = logDates.has(todayStr);

    return {
      ...habit,
      currentStreak,
      longestStreak,
      totalCompletions: logs.length,
      completedToday,
      recentLogs: logs.slice(0, 365).map((l) => l.completedAt.toISOString().split('T')[0]),
    };
  });

  return NextResponse.json({ habits: habitsWithStats });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as unknown;
  const parsed = createHabitSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 });

  const habit = await (prisma as any).habit.create({
    data: {
      ...parsed.data,
      userId: session.user.id,
    },
  });

  return NextResponse.json({ habit }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  await (prisma as any).habit.updateMany({
    where: { id, userId: session.user.id },
    data: { isArchived: true },
  });

  return NextResponse.json({ success: true });
}
