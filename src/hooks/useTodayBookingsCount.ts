import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useTodayBookingsCount = () => {
  const { cleanerId, userRole } = useAuth();

  const fetchTodayBookingsCount = async () => {
    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    // Determine which cleaner ID to use
    const effectiveCleanerId = userRole === 'admin' && !cleanerId ? null : cleanerId;

    let query = supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .gte('date_time', startOfDay)
      .lte('date_time', endOfDay)
      .neq('booking_status', 'cancelled');

    // If we have a cleaner ID, filter by it
    if (effectiveCleanerId) {
      query = query.eq('cleaner', effectiveCleanerId);
    }

    const { count, error } = await query;

    if (error) {
      console.error('Error fetching today bookings count:', error);
      throw error;
    }

    return count || 0;
  };

  return useQuery({
    queryKey: ['today-bookings-count', cleanerId, userRole],
    queryFn: fetchTodayBookingsCount,
    enabled: !!cleanerId || userRole === 'admin', // Only run if we have a cleaner or user is admin
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider stale after 10 seconds
  });
};
