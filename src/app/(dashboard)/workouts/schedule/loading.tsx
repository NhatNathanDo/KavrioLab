import { Skeleton } from '@/components/ui/skeleton';

export default function ScheduleLoading() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-40 rounded-xl" />
        <Skeleton className="h-4 w-64 rounded-lg" />
      </div>

      {/* Week grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-3xl" />
        ))}
      </div>
    </div>
  );
}
