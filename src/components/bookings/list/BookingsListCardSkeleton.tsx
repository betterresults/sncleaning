import { Skeleton } from '@/components/ui/skeleton';

export function BookingsListCardSkeleton() {
  return (
    <div className="booking-list-card" aria-hidden>
      <div className="hidden lg:block">
        <div className="flex items-stretch">
          <div className="flex w-32 shrink-0 items-center justify-center bg-primary/5 py-4">
            <div className="w-20 space-y-2">
              <Skeleton className="mx-auto h-4 w-full" />
              <Skeleton className="mx-auto h-3.5 w-4/5" />
              <Skeleton className="mx-auto h-7 w-14" />
            </div>
          </div>

          <div className="grid min-w-0 flex-1 grid-cols-5 items-center gap-2 py-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="space-y-2 px-4">
                <Skeleton className="h-4 w-full max-w-[7rem]" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </div>

          <div className="w-10 shrink-0 bg-muted/40" />
        </div>
      </div>

      <div className="space-y-3 overflow-hidden p-3 sm:p-4 lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Skeleton className="h-[72px] w-[72px] shrink-0 rounded-xl sm:h-[80px] sm:w-[80px]" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4 max-w-[10rem]" />
              <div className="flex gap-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-4 rounded" />
              </div>
            </div>
          </div>
          <Skeleton className="h-8 w-8 shrink-0 rounded-md" />
        </div>

        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
    </div>
  );
}
