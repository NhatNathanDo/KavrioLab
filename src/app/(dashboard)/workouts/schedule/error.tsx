'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export default function ScheduleError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-8 text-center space-y-4 shadow-sm">
        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" />
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Failed to load schedule</h2>
          <p className="text-xs text-zinc-400">{error.message}</p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-80 transition-opacity"
          >
            Try again
          </button>
          <Link
            href="/workouts"
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
          >
            Back to Workouts
          </Link>
        </div>
      </div>
    </div>
  );
}
