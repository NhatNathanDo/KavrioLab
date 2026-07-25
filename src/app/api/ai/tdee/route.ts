import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { calculateWeightEMA } from '@/lib/calculations';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const now = new Date();
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Fetch weight logs
    const weightLogs = await (prisma as any).weightLog.findMany({
      where: { userId },
      orderBy: { loggedAt: 'asc' },
    });

    // Fetch daily nutrition logs for past 14 days
    const nutritionLogs = await (prisma as any).dailyNutritionLog.findMany({
      where: {
        userId,
        date: { gte: fourteenDaysAgo },
      },
      include: { meals: { include: { items: true } } },
    });

    if (weightLogs.length < 2) {
      return NextResponse.json({
        hasEnoughData: false,
        message: 'Log at least 2 weight entries over a few days to calculate your dynamic TDEE.',
        estimatedTdee: 2200, // Default baseline
      });
    }

    // Calculate EMA weight trend
    const rawWeights = weightLogs.map((w: any) => ({
      loggedAt: new Date(w.loggedAt),
      weightKg: Number(w.weightKg),
    }));

    const emaResult = calculateWeightEMA(rawWeights, 0.10);
    const emaPoints = emaResult.entries;
    const startEma = emaPoints[0].emaTrendKg;
    const endEma = emaPoints[emaPoints.length - 1].emaTrendKg;
    const dayGap = Math.max(
      (new Date(emaPoints[emaPoints.length - 1].loggedAt).getTime() - new Date(emaPoints[0].loggedAt).getTime()) /
        (1000 * 60 * 60 * 24),
      1
    );

    const deltaWeightKgPerDay = (endEma - startEma) / dayGap;

    // Calculate average daily intake
    let totalCalories = 0;
    let loggedDaysCount = 0;

    nutritionLogs.forEach((dayLog: any) => {
      let dayCal = 0;
      dayLog.meals.forEach((m: any) => {
        m.items.forEach((item: any) => {
          dayCal += Number(item.calories || 0);
        });
      });
      if (dayCal > 0) {
        totalCalories += dayCal;
        loggedDaysCount++;
      }
    });

    const avgDailyIntake = loggedDaysCount > 0 ? totalCalories / loggedDaysCount : 2200;

    // Dynamic Expenditure Math: 1kg body mass ≈ 7700 kcal energy equivalent
    // TDEE = Avg Intake - (deltaWeightKgPerDay * 7700)
    const dynamicTdee = Math.round(avgDailyIntake - deltaWeightKgPerDay * 7700);
    const clampedTdee = Math.max(1200, Math.min(5000, dynamicTdee));

    return NextResponse.json({
      hasEnoughData: true,
      dynamicTdee: clampedTdee,
      avgDailyIntake: Math.round(avgDailyIntake),
      weightTrendDeltaKg: Number((endEma - startEma).toFixed(2)),
      dayGap: Math.round(dayGap),
      recommendedDeficitTdee: Math.round(clampedTdee * 0.8), // 20% deficit for fat loss
      recommendedSurplusTdee: Math.round(clampedTdee * 1.1), // 10% surplus for muscle gain
    });
  } catch (error) {
    console.error('Error computing dynamic TDEE:', error);
    return NextResponse.json({ error: 'Failed to calculate dynamic TDEE' }, { status: 500 });
  }
}
