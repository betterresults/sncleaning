import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CleanerUpcomingBooking {
  id: number;
  date_time: string;
  end_date_time: string | null;
  total_hours: number | null;
  first_name: string | null;
  last_name: string | null;
  service_type: string | null;
  cleaning_type: string | null;
  postcode: string | null;
  day_of_week: number; // derived from date_time, 0=Sunday .. 6=Saturday
}

const LOOKAHEAD_DAYS = 14;

// Real booked jobs for a cleaner in the next two weeks, used to give context
// alongside the recurring weekly availability editor (and to flag conflicts).
export const useCleanerUpcomingBookings = (cleanerId: number | null) => {
  return useQuery({
    queryKey: ['cleaner-upcoming-bookings', cleanerId],
    enabled: !!cleanerId,
    queryFn: async (): Promise<CleanerUpcomingBooking[]> => {
      const { data: assignments, error: assignmentsError } = await supabase
        .from('cleaner_payments')
        .select('booking_id')
        .eq('cleaner_id', cleanerId as number);

      if (assignmentsError) throw assignmentsError;

      const bookingIds = (assignments || []).map((a) => a.booking_id).filter((id): id is number => id != null);
      if (bookingIds.length === 0) return [];

      const now = new Date();
      const until = new Date(now.getTime() + LOOKAHEAD_DAYS * 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('bookings')
        .select('id, date_time, end_date_time, total_hours, first_name, last_name, service_type, cleaning_type, postcode, booking_status')
        .in('id', bookingIds)
        .or('booking_status.is.null,booking_status.neq.cancelled')
        .gte('date_time', now.toISOString())
        .lte('date_time', until.toISOString())
        .order('date_time', { ascending: true });

      if (error) throw error;

      return (data || [])
        .filter((b) => !!b.date_time)
        .map((b) => ({
          ...b,
          day_of_week: new Date(b.date_time as string).getDay(),
        }));
    },
  });
};
