import { Skeleton } from '@/components/ui/skeleton';

export default function BillingLoading() {
  return (
    <div className="p-6 md:p-10 space-y-8 max-w-5xl mx-auto">
      <Skeleton className="h-8 w-64 rounded-xl" />
      <Skeleton className="h-64 rounded-3xl" />
      <Skeleton className="h-72 rounded-3xl" />
    </div>
  );
}
