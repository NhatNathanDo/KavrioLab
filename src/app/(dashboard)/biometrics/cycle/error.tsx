'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function CycleTrackerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-96 flex-col items-center justify-center p-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h2 className="mt-4 text-lg font-bold text-zinc-900 dark:text-zinc-100">
        Something went wrong!
      </h2>
      <p className="mt-1 text-sm text-zinc-500">
        {error.message || 'Failed to load Menstrual Cycle Tracker.'}
      </p>
      <button
        onClick={() => reset()}
        className="mt-4 rounded-xl bg-rose-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-rose-600"
      >
        Try Again
      </button>
    </div>
  );
}
