import { Skeleton } from '@/components/ui/skeleton';

export default function PlannerLoading() {
  return (
    <div className="min-h-screen bg-zinc-50/60 dark:bg-zinc-950/40 p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between bg-white dark:bg-zinc-900/80 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-52 rounded-lg" />
            <Skeleton className="h-4 w-72 rounded-lg" />
          </div>
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      {/* Shopping List & Meal Plan Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 space-y-4">
          <Skeleton className="h-6 w-44 rounded-lg" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-2xl" />
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 space-y-4">
          <Skeleton className="h-6 w-44 rounded-lg" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
