import React from 'react';

export default function AuthSkeletonLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950 px-4">
      <div className="w-full max-w-sm rounded-3xl border border-zinc-200 p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/20 animate-pulse space-y-6">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-10 w-10 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-6 w-32 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-4 w-48 rounded-md bg-zinc-100 dark:bg-zinc-900" />
        </div>
        <div className="space-y-4">
          <div className="h-10 w-full rounded-xl bg-zinc-100 dark:bg-zinc-900" />
          <div className="h-10 w-full rounded-xl bg-zinc-100 dark:bg-zinc-900" />
          <div className="h-10 w-full rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>
    </div>
  );
}
