import { Skeleton } from '@/components/ui/skeleton';

export default function AIFoodScannerLoading() {
  return (
    <div className="min-h-screen bg-zinc-50/60 dark:bg-zinc-950/40 p-6 md:p-10 space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 bg-white dark:bg-zinc-900/80 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm">
        <Skeleton className="w-10 h-10 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-56 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded-lg" />
        </div>
      </div>
      <Skeleton className="h-96 rounded-3xl" />
    </div>
  );
}
