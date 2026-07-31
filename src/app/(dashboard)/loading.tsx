import React from 'react';

export default function DashboardSkeletonLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8 animate-pulse">
      {/* Top Header Skeleton */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-4 w-72 rounded-lg bg-zinc-100 dark:bg-zinc-900" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-28 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-10 w-28 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>

      {/* Grid Cards Skeleton */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-32 rounded-3xl border border-zinc-200/80 bg-zinc-50/50 p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/40 space-y-3"
          >
            <div className="flex justify-between items-center">
              <div className="h-4 w-24 rounded-md bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-6 w-6 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
            </div>
            <div className="h-8 w-20 rounded-lg bg-zinc-300 dark:bg-zinc-700" />
            <div className="h-3 w-32 rounded-md bg-zinc-200 dark:bg-zinc-800" />
          </div>
        ))}
      </div>

      {/* Large Content Section Skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="h-80 rounded-3xl border border-zinc-200/80 bg-zinc-50/50 p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/40 lg:col-span-2 space-y-4">
          <div className="h-6 w-40 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-56 w-full rounded-2xl bg-zinc-100 dark:bg-zinc-900/80" />
        </div>
        <div className="h-80 rounded-3xl border border-zinc-200/80 bg-zinc-50/50 p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/40 space-y-4">
          <div className="h-6 w-32 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="h-10 w-full rounded-xl bg-zinc-100 dark:bg-zinc-900/80" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
