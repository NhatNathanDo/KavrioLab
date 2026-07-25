import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

export default function WorkoutHistoryLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-28 rounded-xl" />
          <Skeleton className="h-4 w-40 rounded-lg" />
        </div>
        <Skeleton className="h-4 w-16 rounded-lg" />
      </div>

      {Array.from({ length: 2 }).map((_, weekIdx) => (
        <div key={weekIdx} className="space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-3 w-24 rounded" />
            <div className="flex-1 h-px bg-zinc-100 dark:bg-zinc-900" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl px-5 py-4 space-y-3"
            >
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-44 rounded-lg" />
                <Skeleton className="h-3 w-28 rounded" />
              </div>
              <div className="flex gap-4">
                <Skeleton className="h-3 w-16 rounded" />
                <Skeleton className="h-3 w-24 rounded" />
              </div>
              <Skeleton className="h-3 w-56 rounded" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
