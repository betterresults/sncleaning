import { supabase } from '@/integrations/supabase/client';
import type {
  UpcomingCalendarData,
  UpcomingCalendarParams,
  UpcomingCalendarBooking,
} from './types';

export async function fetchUpcomingCalendarData(
  params: UpcomingCalendarParams,
): Promise<UpcomingCalendarData> {
  const { dashboardDateFilter, sortOrder, userRole, userId, assignedSources = [] } = params;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  let bookingsQuery = supabase.from('bookings').select(`
      *,
      time_only,
      customers!bookings_customer_fkey (
        id,
        first_name,
        last_name
      )
    `);

  if (dashboardDateFilter) {
    bookingsQuery = bookingsQuery
      .gte('date_time', dashboardDateFilter.dateFrom)
      .lte('date_time', dashboardDateFilter.dateTo);
  } else {
    bookingsQuery = bookingsQuery.gte('date_time', todayStart.toISOString());
  }

  const { data: bookingsData, error: bookingsError } = await bookingsQuery
    .order('date_time', { ascending: sortOrder === 'asc' })
    .limit(500);

  if (bookingsError) {
    throw new Error('Failed to load bookings: ' + bookingsError.message);
  }

  const { data: cleanersData, error: cleanersError } = await supabase
    .from('cleaners')
    .select('id, first_name, last_name, full_name')
    .order('first_name');

  if (cleanersError) {
    throw cleanersError;
  }

  const { data: customersData, error: customersError } = await supabase
    .from('customers')
    .select('id, first_name, last_name, source')
    .order('first_name');

  if (customersError) {
    throw customersError;
  }

  const bookingIds = (bookingsData || []).map((b) => b.id);
  const primaryCleanersMap: Record<number, { id: number; full_name: string }> = {};

  if (bookingIds.length > 0) {
    const { data: primaryCleanersData } = await supabase
      .from('cleaner_payments')
      .select(`
        booking_id,
        cleaner_id,
        cleaners (
          id,
          full_name
        )
      `)
      .in('booking_id', bookingIds)
      .eq('is_primary', true);

    primaryCleanersData?.forEach((pc) => {
      if (pc.cleaners) {
        primaryCleanersMap[pc.booking_id] = {
          id: pc.cleaner_id,
          full_name: pc.cleaners.full_name || 'Unknown',
        };
      }
    });
  }

  let enrichedBookings: UpcomingCalendarBooking[] = (bookingsData || []).map((booking) => ({
    ...booking,
    primary_cleaner: primaryCleanersMap[booking.id] || null,
  }));

  const sourceMap: Record<number, string> = {};
  const customerIdsInBookings = new Set(
    (bookingsData || []).map((b) => b.customer).filter(Boolean),
  );
  const sourcesWithBookings = new Set<string>();

  customersData?.forEach((c) => {
    if (c.source) {
      sourceMap[c.id] = c.source;
      if (customerIdsInBookings.has(c.id)) {
        sourcesWithBookings.add(c.source);
      }
    }
  });

  if (userRole === 'sales_agent' && userId) {
    enrichedBookings = enrichedBookings.filter((booking) => {
      if (booking.created_by_user_id === userId) return true;

      if (assignedSources.length > 0 && booking.customer) {
        const customerSource = sourceMap[booking.customer];
        if (customerSource && assignedSources.includes(customerSource)) {
          return true;
        }
      }

      return false;
    });
  }

  return {
    bookings: enrichedBookings,
    cleaners: cleanersData || [],
    customers: (customersData || []).map(({ id, first_name, last_name }) => ({
      id,
      first_name,
      last_name,
    })),
    customerSourceMap: sourceMap,
    availableSources: Array.from(sourcesWithBookings).sort(),
  };
}
