import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useAvailableBookingsCount = () => {
  const fetchAvailableBookingsCount = async () => {
    const { count, error } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .is('cleaner', null)
      .gte('date_time', new Date().toISOString()); // Only future bookings

    if (error) {
      console.error('Error fetching available bookings count:', error);
      throw error;
    }

    return count || 0;
  };

  return useQuery({
    queryKey: ['available-bookings-count'],
    queryFn: fetchAvailableBookingsCount,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider stale after 10 seconds
  });
};