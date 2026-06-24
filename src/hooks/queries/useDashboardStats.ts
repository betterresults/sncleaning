import { useQuery } from '@tanstack/react-query';
import {
  fetchDashboardStats,
  fetchPastBookingsMonthlyStats,
  fetchQuickStats,
  type DashboardStatsFilters,
} from '@/api/dashboard';
import { queryKeys } from '@/lib/queryKeys';

export function useQuickStats() {
  return useQuery({
    queryKey: queryKeys.dashboard.quickStats,
    queryFn: fetchQuickStats,
  });
}

export function useDashboardStats(filters?: DashboardStatsFilters) {
  return useQuery({
    queryKey: queryKeys.dashboard.stats(filters),
    queryFn: () => fetchDashboardStats(filters),
  });
}

export function usePastBookingsMonthlyStats(selectedMonth: string) {
  return useQuery({
    queryKey: queryKeys.dashboard.pastBookingsMonthly(selectedMonth),
    queryFn: () => fetchPastBookingsMonthlyStats(selectedMonth),
  });
}
