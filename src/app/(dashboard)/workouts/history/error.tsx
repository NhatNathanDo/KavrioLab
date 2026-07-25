'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function WorkoutHistoryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to a logging service if needed, but not user credentials or secrets
    console.error('Workout history rendering error:', error);
  }, [error]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-5">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Something went wrong
        </h2>
        <p className="text-xs text-zinc-400">
          We encountered an error loading your workout history details.
        </p>
      </div>

      <div className="flex justify-center gap-3">
        <button
          onClick={() => reset()}
          className="px-5 py-2.5 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 text-xs font-semibold rounded-xl hover:opacity-90 transition-all"
        >
          Try Again
        </button>
        <Link
          href="/workouts"
          className="px-5 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-zinc-650 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
        >
          Back to Workouts
        </Link>
      </div>
    </div>
  );
}
