import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// GET /api/calendar/summary?year=2026&month=7
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get('year') ?? new Date().getFullYear());
  const month = Number(searchParams.get('month') ?? (new Date().getMonth() + 1));

  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const monthEnd = new Date(Date.UTC(year, month, 1));

  const userId = session.user.id;

  const [workouts, nutritionLogs, weightLogs, waterLogs, habitLogs] = await Promise.all([
    // Completed workout sessions
    (prisma as any).workoutLog.findMany({
      where: { userId, startedAt: { gte: monthStart, lt: monthEnd } },
      select: { id: true, startedAt: true, name: true },
    }),
    // Daily nutrition logs with nested meal items for calorie aggregation
    (prisma as any).dailyNutritionLog.findMany({
      where: { userId, date: { gte: monthStart, lt: monthEnd } },
      select: {
        date: true,
        meals: {
          select: {
            items: {
              select: {
                servingQuantity: true,
                foodItem: {
                  select: { calories: true, protein: true },
                },
              },
            },
          },
        },
      },
    }),
    // Weight logs
    (prisma as any).weightLog.findMany({
      where: { userId, loggedAt: { gte: monthStart, lt: monthEnd } },
      select: { loggedAt: true, weightKg: true },
    }),
    // Water logs
    (prisma as any).waterLog.findMany({
      where: { userId, loggedAt: { gte: monthStart, lt: monthEnd } },
      select: { loggedAt: true, amountMl: true },
    }),
    // Habit logs
    (prisma as any).habitLog.findMany({
      where: { userId, completedAt: { gte: monthStart, lt: monthEnd } },
      select: { completedAt: true, habitId: true },
    }),
  ]);

  // Build per-day map indexed by YYYY-MM-DD
  const days: Record<string, {
    workouts: { id: string; name: string }[];
    calories: number | null;
    protein: number | null;
    weightKg: number | null;
    waterMl: number;
    habitsCompleted: number;
  }> = {};

  const ensureDay = (dateStr: string) => {
    if (!days[dateStr]) {
      days[dateStr] = { workouts: [], calories: null, protein: null, weightKg: null, waterMl: 0, habitsCompleted: 0 };
    }
  };

  for (const w of workouts) {
    const d = (w.startedAt as Date).toISOString().split('T')[0];
    ensureDay(d);
    days[d].workouts.push({ id: w.id as string, name: w.name as string });
  }

  for (const n of nutritionLogs) {
    const d = (n.date as Date).toISOString().split('T')[0];
    ensureDay(d);
    let totalCal = 0;
    let totalProt = 0;
    for (const meal of (n.meals as { items: { servingQuantity: unknown; foodItem: { calories: number; protein: unknown } }[] }[])) {
      for (const item of meal.items) {
        const qty = Number(item.servingQuantity ?? 1);
        totalCal += (item.foodItem?.calories ?? 0) * qty;
        totalProt += Number(item.foodItem?.protein ?? 0) * qty;
      }
    }
    if (totalCal > 0) {
      days[d].calories = Math.round(totalCal);
      days[d].protein = Math.round(totalProt);
    }
  }

  for (const wl of weightLogs) {
    const d = (wl.loggedAt as Date).toISOString().split('T')[0];
    ensureDay(d);
    days[d].weightKg = Number(wl.weightKg);
  }

  for (const wa of waterLogs) {
    const d = (wa.loggedAt as Date).toISOString().split('T')[0];
    ensureDay(d);
    days[d].waterMl += wa.amountMl as number;
  }

  for (const hl of habitLogs) {
    const d = (hl.completedAt as Date).toISOString().split('T')[0];
    ensureDay(d);
    days[d].habitsCompleted++;
  }

  return NextResponse.json({ year, month, days });
}
