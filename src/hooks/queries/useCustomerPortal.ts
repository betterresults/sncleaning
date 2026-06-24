import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cancelBooking } from '@/api/bookings';
import {
  fetchCustomerDetailData,
  fetchCustomerIsBusinessClient,
  fetchCustomerOverdueInvoices,
  fetchCustomerPaymentMethodsList,
  fetchCustomerUpcomingBookings,
} from '@/api/customers';
import { queryKeys } from '@/lib/queryKeys';

export function useCustomerPaymentMethodsList(customerId: number | null | undefined) {
  return useQuery({
    queryKey: queryKeys.customers.paymentMethodsList(customerId),
    queryFn: () => fetchCustomerPaymentMethodsList(customerId!),
    enabled: !!customerId,
  });
}

export function useCustomerIsBusinessClient(customerId: number | null | undefined) {
  return useQuery({
    queryKey: queryKeys.customers.isBusinessClient(customerId),
    queryFn: () => fetchCustomerIsBusinessClient(customerId!),
    enabled: !!customerId,
  });
}

export function useCustomerOverdueInvoices(
  customerId: number | null | undefined,
  isBusinessClient: boolean,
) {
  return useQuery({
    queryKey: queryKeys.customers.overdueInvoices(customerId),
    queryFn: () => fetchCustomerOverdueInvoices(customerId!),
    enabled: !!customerId && isBusinessClient,
  });
}

export function useCustomerUpcomingBookings(customerId: number | null | undefined) {
  return useQuery({
    queryKey: queryKeys.customers.upcomingBookings(customerId),
    queryFn: () => fetchCustomerUpcomingBookings(customerId!),
    enabled: !!customerId,
  });
}

export function useInvalidateCustomerPortal() {
  const queryClient = useQueryClient();
  return (customerId: number | null | undefined) => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.customers.upcomingBookings(customerId),
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.customers.paymentMethodsList(customerId),
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.customers.detail(customerId),
    });
  };
}

export function useCancelCustomerBooking(customerId: number | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.customers.upcomingBookings(customerId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.pastBookings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}

export function useCustomerDetailData(
  customerId: number | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.customers.detail(customerId),
    queryFn: () => fetchCustomerDetailData(customerId!),
    enabled: !!customerId && enabled,
  });
}
