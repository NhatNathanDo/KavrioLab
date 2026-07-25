'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function AnalyticsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Analytics Error:', error);
  }, [error]);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[50vh] text-center">
      <div className="p-4 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 mb-4">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
        Failed to load progression analytics
      </h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-md">
        An error occurred while calculating volume data or strength progression trends.
      </p>
      <button
        onClick={() => reset()}
        className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold rounded-xl hover:opacity-90 transition-opacity"
      >
        <RefreshCw className="w-4 h-4" />
        Try Again
      </button>
    </div>
  );
}
