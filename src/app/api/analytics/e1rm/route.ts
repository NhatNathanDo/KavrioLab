import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const exerciseId = searchParams.get('exerciseId');

  // Fetch all exercises logged by the user across history
  const loggedExercises = await prisma.workoutLogExercise.findMany({
    where: {
      workoutLog: {
        userId: session.user.id,
        completedAt: { not: null },
      },
    },
    select: {
      exercise: {
        select: {
          id: true,
          name: true,
          category: true,
          primaryMuscle: true,
        },
      },
    },
    distinct: ['exerciseId'],
  });

  const availableExercises = loggedExercises.map((e) => e.exercise);

  let targetExerciseId = exerciseId;
  if (!targetExerciseId && availableExercises.length > 0) {
    targetExerciseId = availableExercises[0].id;
  }

  if (!targetExerciseId) {
    return NextResponse.json({
      availableExercises: [],
      exercise: null,
      history: [],
      allTimeBestE1rm: 0,
      allTimeBestWeight: 0,
    });
  }

  const exerciseDetails = await prisma.exercise.findUnique({
    where: { id: targetExerciseId },
    select: { id: true, name: true, category: true, primaryMuscle: true },
  });

  const logs = await prisma.workoutLogExercise.findMany({
    where: {
      exerciseId: targetExerciseId,
      workoutLog: {
        userId: session.user.id,
        completedAt: { not: null },
      },
    },
    include: {
      workoutLog: {
        select: {
          id: true,
          name: true,
          startedAt: true,
        },
      },
      sets: true,
    },
    orderBy: {
      workoutLog: {
        startedAt: 'asc',
      },
    },
  });

  let allTimeBestE1rm = 0;
  let allTimeBestWeight = 0;

  const history = logs.map((logEx) => {
    let sessionBestE1rm = 0;
    let sessionBestWeight = 0;
    let sessionBestReps = 0;

    for (const set of logEx.sets) {
      if (set.completed && set.weightKg && set.repsCompleted && set.repsCompleted > 0) {
        const weight = Number(set.weightKg);
        const reps = set.repsCompleted;
        // Brzycki / Epley e1RM formula: weight * (1 + reps / 30)
        const e1rm = reps === 1 ? weight : weight * (1 + reps / 30);

        if (e1rm > sessionBestE1rm) {
          sessionBestE1rm = e1rm;
          sessionBestWeight = weight;
          sessionBestReps = reps;
        }
      }
    }

    if (sessionBestE1rm > allTimeBestE1rm) {
      allTimeBestE1rm = sessionBestE1rm;
    }
    if (sessionBestWeight > allTimeBestWeight) {
      allTimeBestWeight = sessionBestWeight;
    }

    return {
      date: logEx.workoutLog.startedAt.toISOString().split('T')[0],
      workoutName: logEx.workoutLog.name,
      weightKg: sessionBestWeight,
      reps: sessionBestReps,
      e1rmKg: Math.round(sessionBestE1rm * 10) / 10,
    };
  }).filter((item) => item.e1rmKg > 0);

  return NextResponse.json({
    availableExercises,
    exercise: exerciseDetails,
    history,
    allTimeBestE1rm: Math.round(allTimeBestE1rm * 10) / 10,
    allTimeBestWeight: Math.round(allTimeBestWeight * 10) / 10,
  });
}
