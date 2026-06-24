import { Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function BookingsListLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="shadow-md">
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
            </div>
          </CardContent>
        </Card>
      ))}
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
