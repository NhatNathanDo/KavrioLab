import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const checkSchema = z.object({
  habitId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  note: z.string().max(300).optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as unknown;
  const parsed = checkSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 });

  const { habitId, date, note } = parsed.data;

  // Verify ownership
  const habit = await (prisma as any).habit.findFirst({
    where: { id: habitId, userId: session.user.id, isArchived: false },
  });
  if (!habit) return NextResponse.json({ error: 'Habit not found' }, { status: 404 });

  // Build the completedAt date normalized to midnight UTC
  const completedAt = new Date(`${date}T00:00:00.000Z`);

  // Check if already logged for this date — toggle behavior
  const existing = await (prisma as any).habitLog.findFirst({
    where: { habitId, userId: session.user.id, completedAt },
  });

  if (existing) {
    // Un-check: delete the log
    await (prisma as any).habitLog.delete({ where: { id: existing.id } });
    return NextResponse.json({ action: 'unchecked', date });
  }

  // Check: create the log
  const log = await (prisma as any).habitLog.create({
    data: {
      habitId,
      userId: session.user.id,
      completedAt,
      note: note ?? null,
    },
  });

  return NextResponse.json({ action: 'checked', date, log }, { status: 201 });
}
