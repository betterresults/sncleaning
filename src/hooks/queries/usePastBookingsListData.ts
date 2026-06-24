import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchPastBookingsList,
  deletePastBooking,
  type PastBookingsListParams,
} from '@/api/bookings';
import { queryKeys } from '@/lib/queryKeys';

export function usePastBookingsListData(params: PastBookingsListParams) {
  return useQuery({
    queryKey: queryKeys.pastBookings.list(params),
    queryFn: () => fetchPastBookingsList(params),
  });
}

export function useDeletePastBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePastBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pastBookings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}

export function usePastBookingsListParams(
  dashboardDateFilter: PastBookingsListParams['dashboardDateFilter'],
  userRole: string | null | undefined,
  userId: string | null | undefined,
  assignedSources: string[] | undefined,
): PastBookingsListParams {
  return useMemo(
    () => ({
      dashboardDateFilter,
      userRole,
      userId,
      assignedSources,
    }),
    [dashboardDateFilter, userRole, userId, assignedSources],
  );
}
