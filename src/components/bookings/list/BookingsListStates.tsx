import { Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { BookingsListCardSkeleton } from './BookingsListCardSkeleton';

interface BookingsListLoadingProps {
  count?: number;
  showPagination?: boolean;
}

export function BookingsListLoading({
  count = 3,
  showPagination = false,
}: BookingsListLoadingProps) {
  return (
    <div
      className="min-w-0 space-y-3 sm:space-y-4"
      aria-busy
      aria-label="Loading bookings"
    >
      {Array.from({ length: count }).map((_, index) => (
        <BookingsListCardSkeleton key={index} />
      ))}

      {showPagination && (
        <div className="mt-4 flex flex-col gap-3 px-0 sm:mt-6 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <Skeleton className="mx-auto h-4 w-36 sm:mx-0" />
          <div className="flex items-center justify-center gap-2">
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>
        </div>
      )}
    </div>
  );
}

export function BookingsListError({ message }: { message: string }) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <p className="text-red-800">{message}</p>
    </div>
  );
}

export function BookingsListEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-6 px-4">
      <div className="rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] text-center max-w-sm">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
          <Calendar className="h-6 w-6 text-gray-500" />
        </div>
        <p className="text-base font-semibold text-gray-700 mb-1">No bookings for this period</p>
        <p className="text-xs text-gray-500">Select another period or create a new booking</p>
      </div>
    </div>
  );
}
