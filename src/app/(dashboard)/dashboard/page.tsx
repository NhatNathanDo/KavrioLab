import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Activity, Apple, Dumbbell, Target } from 'lucide-react';
import { calculateInitialTargets } from '@/lib/calculations';
import { cookies } from 'next/headers';
import { dictionaries } from '@/lib/translations/dictionaries';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const userId = session.user.id;

  const profile = await prisma.userProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    redirect('/onboarding');
  }

  const targets = calculateInitialTargets({
    gender: (profile.gender as any) || 'FEMALE',
    birthDate: profile.birthDate
      ? profile.birthDate.toISOString().split('T')[0]
      : '1995-01-01',
    heightCm: Number(profile.heightCm),
    weightKg: Number(profile.targetWeightKg),
    targetWeightKg: Number(profile.targetWeightKg),
    activityTier: (profile.activityTier as any) || 'SEDENTARY',
    unitSystem: (profile.unitSystem as any) || 'METRIC',
    goal: 'MAINTENANCE',
  });

  const cookieStore = await cookies();
  const language = (cookieStore.get('language')?.value as 'en' | 'vi') || 'en';
  const dict = dictionaries[language] || dictionaries.en;

  return (
    <div className="space-y-8 max-w-5xl mx-auto transition-colors duration-200">
      {/* Welcome Card */}
      <div className="bg-zinc-50/80 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-8 shadow-sm">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {dict.dashboard.welcome} {session.user.name || 'Athlete'}
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
          {dict.dashboard.subtitle}
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {/* Calorie Card */}
        <div className="bg-zinc-50/80 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/80 p-6 rounded-3xl space-y-3">
          <div className="flex justify-between items-center text-zinc-400 dark:text-zinc-555">
            <span className="text-[11px] font-semibold uppercase tracking-widest">
              {dict.dashboard.nutritionTarget}
            </span>
            <Apple className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          </div>
          <div className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {targets.calories} <span className="text-sm font-normal text-zinc-400 dark:text-zinc-500">kcal</span>
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">{dict.dashboard.dailyTarget}</div>
        </div>

        {/* Protein Card */}
        <div className="bg-zinc-50/80 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/80 p-6 rounded-3xl space-y-3">
          <div className="flex justify-between items-center text-zinc-400 dark:text-zinc-555">
            <span className="text-[11px] font-semibold uppercase tracking-widest">
              {dict.dashboard.proteinTarget}
            </span>
            <Target className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          </div>
          <div className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {targets.protein} <span className="text-sm font-normal text-zinc-400 dark:text-zinc-500">g</span>
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">{dict.dashboard.muscleGoal}</div>
        </div>

        {/* Height Card */}
        <div className="bg-zinc-50/80 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/80 p-6 rounded-3xl space-y-3">
          <div className="flex justify-between items-center text-zinc-400 dark:text-zinc-555">
            <span className="text-[11px] font-semibold uppercase tracking-widest">
              {dict.dashboard.heightProfile}
            </span>
            <Activity className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          </div>
          <div className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {Number(profile.heightCm)} <span className="text-sm font-normal text-zinc-400 dark:text-zinc-500">cm</span>
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">{dict.dashboard.statureBaseline}</div>
        </div>

        {/* Goal Weight Card */}
        <div className="bg-zinc-50/80 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/80 p-6 rounded-3xl space-y-3">
          <div className="flex justify-between items-center text-zinc-400 dark:text-zinc-555">
            <span className="text-[11px] font-semibold uppercase tracking-widest">
              {dict.dashboard.goalWeight}
            </span>
            <Dumbbell className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          </div>
          <div className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {Number(profile.targetWeightKg)} <span className="text-sm font-normal text-zinc-400 dark:text-zinc-500">kg</span>
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">{dict.dashboard.composition}</div>
        </div>
      </div>

      {/* Action links */}
      <div className="flex gap-4 pt-2">
        <Link
          href="/workouts"
          className="px-6 py-3 bg-zinc-900 dark:bg-zinc-50 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-zinc-50 dark:text-zinc-900 font-medium text-xs rounded-xl shadow transition"
        >
          {dict.dashboard.logWorkout}
        </Link>
        <Link
          href="/nutrition"
          className="px-6 py-3 bg-transparent border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-900 dark:text-zinc-50 font-medium text-xs rounded-xl transition"
        >
          {dict.dashboard.viewFood}
        </Link>
      </div>
    </div>
  );
}
