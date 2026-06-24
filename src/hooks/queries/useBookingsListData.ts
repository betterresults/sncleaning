import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchBookingsList,
  fetchCustomerPaymentMethodIds,
  cancelBooking,
  deleteBooking,
  type BookingsListParams,
} from '@/api/bookings';
import { queryKeys } from '@/lib/queryKeys';

export function useBookingsListData(params: BookingsListParams) {
  return useQuery({
    queryKey: queryKeys.bookings.list(params),
    queryFn: () => fetchBookingsList(params),
  });
}

export function useCustomerPaymentMethods(customerIds: number[]) {
  const stableIds = useMemo(
    () => [...new Set(customerIds)].sort((a, b) => a - b),
    [customerIds],
  );

  return useQuery({
    queryKey: queryKeys.customers.paymentMethods(stableIds),
    queryFn: () => fetchCustomerPaymentMethodIds(stableIds),
    enabled: stableIds.length > 0,
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.pastBookings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
    },
  });
}

export function useDeleteBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.pastBookings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
    },
  });
}
