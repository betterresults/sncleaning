import { useQuery } from '@tanstack/react-query';
import { fetchUpcomingCalendarData, type UpcomingCalendarParams } from '@/api/bookings';
import { queryKeys } from '@/lib/queryKeys';

export function useUpcomingBookingsCalendarData(
  params: UpcomingCalendarParams,
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.upcomingCalendar.data(params),
    queryFn: () => fetchUpcomingCalendarData(params),
    enabled,
  });
}
