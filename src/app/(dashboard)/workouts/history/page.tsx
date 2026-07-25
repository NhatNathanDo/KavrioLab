import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Calendar, ChevronRight, Dumbbell, Clock, ArrowLeft } from 'lucide-react';
import { PageTransition } from '@/components/shared/PageTransition';
import { cookies } from 'next/headers';
import { dictionaries } from '@/lib/translations/dictionaries';

// ─── Types ───────────────────────────────────────────────────────────────────

interface WorkoutSet {
  weightKg: number | { toNumber: () => number };
  repsCompleted: number;
  completed: boolean;
}

interface WorkoutExercise {
  id: string;
  exercise: { name: string };
  sets: WorkoutSet[];
}

interface WorkoutSummary {
  id: string;
  name: string;
  startedAt: Date;
  completedAt: Date | null;
  exercises: WorkoutExercise[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function groupByWeek(workouts: WorkoutSummary[]): Record<string, WorkoutSummary[]> {
  const groups: Record<string, WorkoutSummary[]> = {};
  for (const w of workouts) {
    const d = new Date(w.startedAt);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay() + 1); // Monday
    const key = weekStart.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    if (!groups[key]) groups[key] = [];
    groups[key].push(w);
  }
  return groups;
}

function formatDuration(start: Date, end: Date | null): string {
  if (!end) return '—';
  const mins = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function calcVolume(exercises: WorkoutExercise[]): number {
  return exercises.reduce(
    (total, ex) =>
      total +
      ex.sets
        .filter((s) => s.completed)
        .reduce((s, set) => s + Number(set.weightKg) * set.repsCompleted, 0),
    0
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function WorkoutHistoryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const cookieStore = await cookies();
  const language = (cookieStore.get('language')?.value as 'en' | 'vi') || 'en';
  const dict = dictionaries[language] || dictionaries.en;

  const workouts = (await prisma.workoutLog.findMany({
    where: { userId: session.user.id },
    orderBy: { startedAt: 'desc' },
    take: 50,
    select: {
      id: true,
      name: true,
      startedAt: true,
      completedAt: true,
      exercises: {
        select: {
          id: true,
          exercise: { select: { name: true } },
          sets: { select: { weightKg: true, repsCompleted: true, completed: true } },
        },
      },
    },
  })) as WorkoutSummary[];

  const grouped = groupByWeek(workouts);

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {dict.workouts.historyTitle}
            </h1>
            <p className="text-sm text-zinc-400 mt-1">{workouts.length} {dict.workouts.historySubtitle}</p>
          </div>
          <Link
            href="/workouts"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {dict.workouts.back}
          </Link>
        </div>

        {workouts.length === 0 ? (
          <div className="bg-white dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-900 rounded-3xl p-8 py-20 text-center space-y-3 shadow-[0_8px_30px_rgb(0,0,0,0.01)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)]">
            <Calendar className="w-10 h-10 text-zinc-200 dark:text-zinc-800 mx-auto" />
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{dict.workouts.noHistory}</p>
            <p className="text-xs text-zinc-400">{dict.workouts.noHistoryDesc}</p>
            <Link
              href="/workouts"
              className="inline-block mt-2 px-5 py-2.5 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 text-xs font-semibold rounded-xl hover:opacity-90 transition-all"
            >
              {dict.workouts.startWorkout}
            </Link>
          </div>
        ) : (
          Object.entries(grouped).map(([week, sessions]) => (
            <div key={week} className="space-y-3">
              {/* Week label */}
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  {dict.workouts.weekOf} {week}
                </span>
                <div className="flex-1 h-px bg-zinc-100 dark:bg-zinc-900" />
                <span className="text-[10px] text-zinc-400">{sessions.length} {dict.workouts.sessions}</span>
              </div>

              {/* Session cards */}
              {sessions.map((w) => {
                const volume = calcVolume(w.exercises);
                const exerciseCount = w.exercises.length;
                const setCount = w.exercises.reduce(
                  (s, ex) => s + ex.sets.filter((set) => set.completed).length,
                  0
                );

                return (
                  <Link
                    key={w.id}
                    href={`/workouts/history/${w.id}`}
                    className="group block bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl px-6 py-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:shadow-md hover:border-zinc-355 dark:hover:border-zinc-800 hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-2">
                        <div>
                          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                            {w.name}
                          </p>
                          <p className="text-[11px] text-zinc-400 mt-0.5">
                            {new Date(w.startedAt).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        </div>

                        {/* Stats row */}
                        <div className="flex items-center gap-4 flex-wrap">
                          <span className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                            <Clock className="w-3.5 h-3.5" />
                            {formatDuration(w.startedAt, w.completedAt)}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                            <Dumbbell className="w-3.5 h-3.5" />
                            {exerciseCount} {dict.workouts.cardExercises.toLowerCase()} · {setCount} {dict.workouts.set.toLowerCase() + (language === 'en' ? 's' : '')}
                          </span>
                          {volume > 0 && (
                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                              {Math.round(volume).toLocaleString()} {dict.workouts.vol}
                            </span>
                          )}
                        </div>

                        {/* Exercise names */}
                        <p className="text-[11px] text-zinc-400 truncate">
                          {w.exercises
                            .map((ex) => ex.exercise.name)
                            .slice(0, 4)
                            .join(' · ')}
                          {w.exercises.length > 4 && ` +${w.exercises.length - 4} ${language === 'vi' ? 'khác' : 'more'}`}
                        </p>
                      </div>

                      <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-zinc-700 group-hover:text-zinc-500 dark:group-hover:text-zinc-400 flex-shrink-0 mt-1 transition-colors" />
                    </div>
                  </Link>
                );
              })}
            </div>
          ))
        )}
      </div>
    </PageTransition>
  );
}
