import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Calendar, Clock, ArrowLeft } from 'lucide-react';
import { DeleteHistoryButton } from '@/components/workout/DeleteHistoryButton';
import { cookies } from 'next/headers';
import { dictionaries } from '@/lib/translations/dictionaries';

interface PageProps {
  params: Promise<{ id: string }>;
}

function formatDuration(start: Date, end: Date | null): string {
  if (!end) return '—';
  const mins = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export default async function WorkoutHistoryDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const cookieStore = await cookies();
  const language = (cookieStore.get('language')?.value as 'en' | 'vi') || 'en';
  const dict = dictionaries[language] || dictionaries.en;

  const { id } = await params;

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    notFound();
  }

  const workout = await prisma.workoutLog.findUnique({
    where: { id },
    include: {
      exercises: {
        orderBy: { orderIndex: 'asc' },
        include: {
          exercise: true,
          sets: true,
        },
      },
    },
  });

  if (!workout || workout.userId !== session.user.id) {
    notFound();
  }

  const totalVolume = workout.exercises.reduce(
    (total, ex) =>
      total +
      ex.sets
        .filter((s) => s.completed)
        .reduce((s, set) => s + Number(set.weightKg) * set.repsCompleted, 0),
    0
  );

  const totalSets = workout.exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
    0
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
        {/* Header / Actions */}
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/workouts/history"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {dict.workouts.backToHistory}
          </Link>
          <DeleteHistoryButton id={workout.id} />
        </div>

        {/* Main Info */}
        <div className="space-y-3">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {workout.name}
          </h1>
          <div className="flex items-center gap-4 flex-wrap text-xs text-zinc-400 font-medium">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(workout.startedAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {new Date(workout.startedAt).toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
              {workout.completedAt && (
                <>
                  {' '}
                  –{' '}
                  {new Date(workout.completedAt).toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </>
              )}
            </span>
          </div>
        </div>

        {/* Stats Summary Widget */}
        <div className="grid grid-cols-3 gap-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
          <div className="text-center space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{dict.workouts.duration}</p>
            <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              {formatDuration(workout.startedAt, workout.completedAt)}
            </p>
          </div>
          <div className="text-center space-y-1 border-x border-zinc-100 dark:border-zinc-900">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{dict.workouts.volume}</p>
            <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              {Math.round(totalVolume).toLocaleString()} kg
            </p>
          </div>
          <div className="text-center space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{dict.workouts.setsDone}</p>
            <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              {totalSets}
            </p>
          </div>
        </div>

        {/* Notes widget */}
        {workout.notes && (
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-5 space-y-2 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{dict.workouts.notes}</h4>
            <p className="text-sm text-zinc-650 dark:text-zinc-350 whitespace-pre-wrap">
              {workout.notes}
            </p>
          </div>
        )}

        {/* Exercises List */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">{dict.workouts.cardExercises}</h3>
          
          {workout.exercises.map((ex) => {
            const exerciseVolume = ex.sets
              .filter((s) => s.completed)
              .reduce((s, set) => s + Number(set.weightKg) * set.repsCompleted, 0);

            return (
              <div
                key={ex.id}
                className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] animate-fade-in"
              >
                {/* Exercise header */}
                <div className="flex justify-between items-center px-5 py-4 border-b border-zinc-100 dark:border-zinc-900">
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      {ex.exercise.name}
                    </h4>
                    <p className="text-[10px] text-zinc-400 mt-0.5 font-medium">
                      {(dict.workouts.categories as any)[ex.exercise.category.toLowerCase()] || ex.exercise.category} · {ex.exercise.equipment.replace('_', ' ').toLowerCase()}
                    </p>
                  </div>
                  {exerciseVolume > 0 && (
                    <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded-full font-medium">
                      {dict.workouts.vol}: {Math.round(exerciseVolume).toLocaleString()} kg
                    </span>
                  )}
                </div>

                {/* Set rows */}
                <div className="px-5 py-4 space-y-2.5">
                  {/* Column Headers */}
                  <div
                    className="grid text-[9px] font-bold uppercase tracking-widest text-zinc-400 px-3"
                    style={{ gridTemplateColumns: '40px 1fr 1fr 1fr' }}
                  >
                    <span>{dict.workouts.set}</span>
                    <span className="text-center">{dict.workouts.targetKg}</span>
                    <span className="text-center">{dict.workouts.targetReps}</span>
                    <span className="text-center">RPE</span>
                  </div>

                  {ex.sets.map((set, sIdx) => {
                    let badge = '';
                    if (set.setType === 'WARMUP') badge = 'W';
                    if (set.setType === 'DROP') badge = 'D';
                    if (set.setType === 'FAILURE') badge = 'F';

                    return (
                      <div
                        key={set.id}
                        className={`grid items-center text-sm px-3 py-1.5 rounded-xl transition-colors ${
                          set.completed
                            ? 'text-zinc-900 dark:text-zinc-50'
                            : 'text-zinc-350 dark:text-zinc-750 line-through'
                        }`}
                        style={{ gridTemplateColumns: '40px 1fr 1fr 1fr' }}
                      >
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] font-semibold font-mono text-zinc-400">
                            {sIdx + 1}
                          </span>
                          {badge && (
                            <span className="text-[8px] font-bold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/20 px-1 rounded-sm">
                              {badge}
                            </span>
                          )}
                        </div>
                        <span className="text-center font-mono">{Number(set.weightKg)} kg</span>
                        <span className="text-center font-mono">{set.repsCompleted}</span>
                        <span className="text-center font-mono">{set.rpe ? Number(set.rpe) : '—'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
