import React from 'react';
import { Activity } from 'lucide-react';

export default function RootLoading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-zinc-950 transition-colors duration-200">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-900 shadow-sm animate-pulse">
          <Activity className="h-7 w-7 text-rose-500 animate-spin" />
        </div>
        <div className="flex items-center gap-1.5 text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          <span>Kavrio</span>
          <span className="font-light text-zinc-400">Lab</span>
        </div>
      </div>
    </div>
  );
}
