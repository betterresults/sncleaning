import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CleanerUpcomingBooking {
  id: number;
  date_time: string;
  end_date_time: string | null;
  total_hours: number | null;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  service_type: string | null;
  cleaning_type: string | null;
  address: string | null;
  postcode: string | null;
  booking_status: string | null;
  frequently: string | null;
  occupied: string | null;
  exclude_areas: string | null;
  extras: string | null;
  key_collection: string | null;
  access: string | null;
  parking_details: string | null;
  additional_details: string | null;
  property_details: string | null;
  day_of_week: number; // derived from date_time, 0=Sunday .. 6=Saturday
}

const BOOKING_SELECT_COLUMNS =
  'id, date_time, end_date_time, total_hours, first_name, last_name, phone_number, service_type, cleaning_type, address, postcode, booking_status, frequently, occupied, exclude_areas, extras, key_collection, access, parking_details, additional_details, property_details';

const LOOKAHEAD_DAYS = 14;

// `date_time`/`end_date_time` are written as naive London wall-clock time with a hardcoded
// "+00:00" suffix (see NewBookingForm's dateTimeStr construction), not real UTC — so every
// read here uses the UTC getters/ISO strings to recover the business's actual clock instead
// of shifting by the viewer's device timezone.
const fetchCleanerBookingsBetween = async (
  cleanerId: number,
  rangeStartIso: string,
  rangeEndIso: string
): Promise<CleanerUpcomingBooking[]> => {
  const { data: assignments, error: assignmentsError } = await supabase
    .from('cleaner_payments')
    .select('booking_id')
    .eq('cleaner_id', cleanerId);

  if (assignmentsError) throw assignmentsError;

  const bookingIds = (assignments || []).map((a) => a.booking_id).filter((id): id is number => id != null);
  if (bookingIds.length === 0) return [];

  const { data, error } = await supabase
    .from('bookings')
    .select(BOOKING_SELECT_COLUMNS)
    .in('id', bookingIds)
    .or('booking_status.is.null,booking_status.neq.cancelled')
    .gte('date_time', rangeStartIso)
    .lt('date_time', rangeEndIso)
    .order('date_time', { ascending: true });

  if (error) throw error;

  return (data || [])
    .filter((b) => !!b.date_time)
    .map((b) => ({
      ...b,
      day_of_week: new Date(b.date_time as string).getUTCDay(),
    }));
};

// Real booked jobs for a cleaner in the next two weeks, used to give context
// alongside the recurring weekly availability editor (and to flag conflicts).
export const useCleanerUpcomingBookings = (cleanerId: number | null) => {
  return useQuery({
    queryKey: ['cleaner-upcoming-bookings', cleanerId],
    enabled: !!cleanerId,
    queryFn: async (): Promise<CleanerUpcomingBooking[]> => {
      const now = new Date();
      const until = new Date(now.getTime() + LOOKAHEAD_DAYS * 24 * 60 * 60 * 1000);
      return fetchCleanerBookingsBetween(cleanerId as number, now.toISOString(), until.toISOString());
    },
  });
};

// Real booked jobs for a cleaner within a specific calendar week, used to draw booking
// blocks on the "My Availability" week grid. `weekStart` must be the UTC midnight of the
// week's first day (see startOfWeekUTC/addDaysUTC in CleanerAvailability.tsx).
export const useCleanerBookingsForWeek = (cleanerId: number | null, weekStart: Date) => {
  const weekStartIso = weekStart.toISOString();
  return useQuery({
    queryKey: ['cleaner-bookings-week', cleanerId, weekStartIso],
    enabled: !!cleanerId,
    queryFn: async (): Promise<CleanerUpcomingBooking[]> => {
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      return fetchCleanerBookingsBetween(cleanerId as number, weekStartIso, weekEnd.toISOString());
    },
  });
};
