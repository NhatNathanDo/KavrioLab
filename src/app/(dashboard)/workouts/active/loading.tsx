import { Skeleton } from '@/components/ui/skeleton';

export default function ActiveWorkoutLoading() {
  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      {/* Sticky header skeleton */}
      <div className="sticky top-0 z-20 bg-[var(--bg-card)]/90 backdrop-blur-md border-b border-[var(--border)] px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-40 rounded-lg" />
            <Skeleton className="h-3 w-24 rounded-lg" />
          </div>
          <Skeleton className="h-8 w-20 rounded-xl" />
        </div>
      </div>

      {/* Body skeleton */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-5 space-y-3">
            <Skeleton className="h-4 w-36 rounded-lg" />
            <Skeleton className="h-3 w-24 rounded-lg" />
            <div className="space-y-2 pt-2">
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="h-10 rounded-xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
