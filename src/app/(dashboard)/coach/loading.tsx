import { Skeleton } from '@/components/ui/skeleton';

export default function CoachLoading() {
  return (
    <div className="h-[calc(100vh-100px)] max-w-5xl mx-auto flex flex-col p-4 md:p-6 space-y-4">
      <Skeleton className="h-20 rounded-3xl" />
      <Skeleton className="flex-1 rounded-3xl" />
      <Skeleton className="h-12 rounded-3xl" />
    </div>
  );
}
