import { Skeleton } from '@/components/ui/skeleton';

const BAR_HEIGHTS = [42, 68, 55, 82, 48, 74, 60];

interface PerformanceChartSkeletonProps {
  height: number;
}

export function PerformanceChartSkeleton({ height }: PerformanceChartSkeletonProps) {
  const chartAreaHeight = height - 48;

  return (
    <div
      className="flex w-full min-w-0 flex-col"
      style={{ height }}
      aria-busy
      aria-label="Loading performance chart"
    >
      <div className="mb-3 flex items-center justify-end gap-4">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-14" />
      </div>

      <div
        className="flex items-end gap-2 border-b border-border/60 pb-2 sm:gap-3"
        style={{ height: chartAreaHeight }}
      >
        {BAR_HEIGHTS.map((barHeight, index) => (
          <div key={index} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <Skeleton
              className="w-full max-w-10 rounded-t-md"
              style={{ height: Math.round((barHeight / 100) * chartAreaHeight) }}
            />
            <Skeleton className="h-3 w-8" />
          </div>
        ))}
      </div>
    </div>
  );
}
