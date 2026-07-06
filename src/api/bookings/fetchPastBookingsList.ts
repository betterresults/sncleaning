import { supabase } from '@/integrations/supabase/client';
import { getUKNowAsStoredString } from '@/lib/ukTime';
import type {
  CleanerOption,
  PastBookingListItem,
  PastBookingsListData,
  PastBookingsListParams,
} from './types';

export async function fetchPastBookingsList(
  params: PastBookingsListParams,
): Promise<PastBookingsListData> {
  const {
    dashboardDateFilter,
    userRole,
    userId,
    assignedSources = [],
  } = params;

  let bookingsQuery = supabase.from('past_bookings').select('*');

  if (dashboardDateFilter) {
    bookingsQuery = bookingsQuery
      .gte('date_time', dashboardDateFilter.dateFrom)
      .lte('date_time', dashboardDateFilter.dateTo);
  } else {
    const nowIso = getUKNowAsStoredString();
    bookingsQuery = bookingsQuery.or(
      `date_time.lte.${nowIso},booking_status.eq.Completed,booking_status.eq.completed`,
    );
  }

  const { data: bookingsData, error: bookingsError } = await bookingsQuery.order(
    'date_time',
    { ascending: false },
  );

  if (bookingsError) {
    throw new Error('Failed to load past bookings: ' + bookingsError.message);
  }

  let cleaners: CleanerOption[] = [];
  if (!dashboardDateFilter) {
    const { data: cleanersData, error: cleanersError } = await supabase
      .from('cleaners')
      .select('id, first_name, last_name')
      .order('first_name');

    if (cleanersError) {
      console.error('Error fetching cleaners:', cleanersError);
    } else {
      cleaners = cleanersData || [];
    }
  }

  const { data: allCleaners } = await supabase
    .from('cleaners')
    .select('id, first_name, last_name');

  const { data: allCustomers } = await supabase
    .from('customers')
    .select('id, first_name, last_name, source');

  const sourceMap: Record<number, string> = {};
  const sourcesWithBookings = new Set<string>();
  const customerIdsInBookings = new Set(
    (bookingsData || []).map((b) => b.customer).filter(Boolean),
  );

  allCustomers?.forEach((c) => {
    if (c.source) {
      sourceMap[c.id] = c.source;
      if (customerIdsInBookings.has(c.id)) {
        sourcesWithBookings.add(c.source);
      }
    }
  });

  let bookingsWithRelations: PastBookingListItem[] = (bookingsData || []).map(
    (booking) => ({
      ...booking,
      cleaners: booking.cleaner
        ? allCleaners?.find((c) => c.id === booking.cleaner) || null
        : null,
      customers: booking.customer
        ? allCustomers?.find((c) => c.id === booking.customer) || null
        : null,
    }),
  );

  if (userRole === 'sales_agent' && userId) {
    bookingsWithRelations = bookingsWithRelations.filter((booking) => {
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
    bookings: bookingsWithRelations,
    cleaners,
    customerSourceMap: sourceMap,
    availableSources: Array.from(sourcesWithBookings).sort(),
  };
}
