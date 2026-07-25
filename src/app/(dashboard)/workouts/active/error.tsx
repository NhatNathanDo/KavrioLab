'use client';

import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function ActiveWorkoutError({ error }: { error: Error }) {
  return (
    <div className="min-h-screen bg-[var(--bg-page)] flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Something went wrong
        </h2>
        <p className="text-xs text-zinc-400">{error.message}</p>
        <Link
          href="/workouts"
          className="inline-block px-5 py-2.5 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 text-xs font-semibold rounded-xl hover:opacity-90 transition-all"
        >
          Back to Workouts
        </Link>
      </div>
    </div>
  );
}
