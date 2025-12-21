import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export const useAvailableBookingsCount = () => {
  const queryClient = useQueryClient();

  const fetchAvailableBookingsCount = async () => {
    const { count, error } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .is('cleaner', null)
      .neq('booking_status', 'cancelled')
      .gte('date_time', new Date().toISOString()); // Only future bookings

    if (error) {
      console.error('Error fetching available bookings count:', error);
      throw error;
    }

    return count || 0;
  };

  // Real-time subscription for instant updates
  useEffect(() => {
    const channel = supabase
      .channel('available-bookings-count-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        () => {
          // Invalidate the count query to refetch immediately
          queryClient.invalidateQueries({ queryKey: ['available-bookings-count'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['available-bookings-count'],
    queryFn: fetchAvailableBookingsCount,
    staleTime: 0, // Always refetch when invalidated
  });
};