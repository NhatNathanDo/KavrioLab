import { Skeleton } from '@/components/ui/skeleton';

export default function WorkoutHistoryDetailLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8 animate-pulse">
      {/* Header/Actions Skeleton */}
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-4 w-28 rounded-lg" />
        <Skeleton className="h-9 w-24 rounded-xl" />
      </div>

      {/* Title Area Skeleton */}
      <div className="space-y-2.5">
        <Skeleton className="h-7 w-48 rounded-xl" />
        <div className="flex gap-4">
          <Skeleton className="h-4 w-32 rounded-lg" />
          <Skeleton className="h-4 w-24 rounded-lg" />
        </div>
      </div>

      {/* Stats Summary Skeleton */}
      <div className="grid grid-cols-3 gap-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-5">
        <div className="text-center space-y-2">
          <Skeleton className="h-3 w-16 mx-auto rounded" />
          <Skeleton className="h-5 w-12 mx-auto rounded-lg" />
        </div>
        <div className="text-center space-y-2 border-x border-[var(--border)]">
          <Skeleton className="h-3 w-16 mx-auto rounded" />
          <Skeleton className="h-5 w-16 mx-auto rounded-lg" />
        </div>
        <div className="text-center space-y-2">
          <Skeleton className="h-3 w-16 mx-auto rounded" />
          <Skeleton className="h-5 w-10 mx-auto rounded-lg" />
        </div>
      </div>

      {/* Exercises Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-4 w-20 rounded" />
        
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex justify-between items-center px-5 py-4 border-b border-[var(--border)]">
              <div className="space-y-2">
                <Skeleton className="h-4 w-40 rounded-lg" />
                <Skeleton className="h-3 w-28 rounded" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>

            {/* Set Rows */}
            <div className="px-5 py-4 space-y-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div
                  key={j}
                  className="grid items-center"
                  style={{ gridTemplateColumns: '40px 1fr 1fr 1fr' }}
                >
                  <Skeleton className="h-3 w-6 rounded" />
                  <Skeleton className="h-4 w-12 mx-auto rounded" />
                  <Skeleton className="h-4 w-8 mx-auto rounded" />
                  <Skeleton className="h-4 w-6 mx-auto rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
