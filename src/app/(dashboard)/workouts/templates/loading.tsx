import { Skeleton } from '@/components/ui/skeleton';

export default function TemplatesLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-32 rounded-xl" />
          <Skeleton className="h-4 w-48 rounded-lg" />
        </div>
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-5 space-y-4"
          >
            <div className="space-y-2">
              <Skeleton className="h-4 w-32 rounded-lg" />
              <Skeleton className="h-3 w-48 rounded" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="h-3 w-2/3 rounded" />
            </div>
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-9 flex-1 rounded-xl" />
              <Skeleton className="h-9 w-9 rounded-xl" />
              <Skeleton className="h-9 w-9 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
