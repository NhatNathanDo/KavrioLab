import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { MuscleGroup } from '@prisma/client';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const range = searchParams.get('range') || '30d'; // 7d, 30d, 3m, 1y, all

  const now = new Date();
  let startDate: Date | undefined;

  if (range === '7d') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (range === '30d') {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (range === '3m') {
    startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  } else if (range === '1y') {
    startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  }

  const workoutLogs = await prisma.workoutLog.findMany({
    where: {
      userId: session.user.id,
      completedAt: {
        not: null,
        ...(startDate ? { gte: startDate } : {}),
      },
    },
    select: {
      id: true,
      startedAt: true,
      exercises: {
        select: {
          exercise: {
            select: {
              primaryMuscle: true,
            },
          },
          sets: {
            select: {
              completed: true,
              weightKg: true,
              repsCompleted: true,
            },
          },
        },
      },
    },
    orderBy: {
      startedAt: 'asc',
    },
  });

  // Calculate volume per date and volume per muscle group
  const dateVolumeMap: Record<string, { volumeKg: number; setsCount: number; workoutsCount: number }> = {};
  const muscleVolumeMap: Record<string, number> = {};

  let totalVolumeKg = 0;
  let totalSetsCount = 0;

  for (const log of workoutLogs) {
    const dateKey = log.startedAt.toISOString().split('T')[0];
    if (!dateVolumeMap[dateKey]) {
      dateVolumeMap[dateKey] = { volumeKg: 0, setsCount: 0, workoutsCount: 0 };
    }
    dateVolumeMap[dateKey].workoutsCount += 1;

    for (const ex of log.exercises) {
      const muscle = ex.exercise.primaryMuscle || MuscleGroup.OTHER;
      for (const set of ex.sets) {
        if (set.completed && set.weightKg && set.repsCompleted) {
          const setVol = Number(set.weightKg) * set.repsCompleted;
          totalVolumeKg += setVol;
          totalSetsCount += 1;

          dateVolumeMap[dateKey].volumeKg += setVol;
          dateVolumeMap[dateKey].setsCount += 1;

          muscleVolumeMap[muscle] = (muscleVolumeMap[muscle] || 0) + setVol;
        }
      }
    }
  }

  const volumeHistory = Object.entries(dateVolumeMap).map(([date, data]) => ({
    date,
    volumeKg: Math.round(data.volumeKg),
    setsCount: data.setsCount,
    workoutsCount: data.workoutsCount,
  }));

  const muscleDistribution = Object.entries(muscleVolumeMap).map(([muscleGroup, volumeKg]) => ({
    muscleGroup,
    volumeKg: Math.round(volumeKg),
    percentage: totalVolumeKg > 0 ? Math.round((volumeKg / totalVolumeKg) * 100) : 0,
  })).sort((a, b) => b.volumeKg - a.volumeKg);

  const topMuscleGroup = muscleDistribution.length > 0 ? muscleDistribution[0].muscleGroup : 'N/A';

  return NextResponse.json({
    volumeHistory,
    muscleDistribution,
    summaryMetrics: {
      totalVolumeKg: Math.round(totalVolumeKg),
      totalWorkouts: workoutLogs.length,
      totalSets: totalSetsCount,
      topMuscleGroup,
    },
  });
}
