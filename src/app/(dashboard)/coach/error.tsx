'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';

export default function CoachError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-zinc-50/60 dark:bg-zinc-950/40 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 text-center space-y-4 shadow-xl">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto border border-red-500/20">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
          Failed to load AI Coach
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {error.message || 'An error occurred while communicating with the AI Coach service.'}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 text-xs font-bold rounded-xl hover:opacity-90 transition-all shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Try Again</span>
        </button>
      </div>
    </div>
  );
}
