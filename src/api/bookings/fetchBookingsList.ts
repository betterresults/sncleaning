import { supabase } from '@/integrations/supabase/client';
import type {
  BookingsListData,
  BookingsListParams,
  BookingListItem,
  CleanerOption,
} from './types';

export async function fetchBookingsList(
  params: BookingsListParams,
): Promise<BookingsListData> {
  const { dashboardDateFilter, filterBySubmissionDate = false } = params;
  const includeCleaners = params.includeCleaners ?? !dashboardDateFilter;

  let bookingsQuery = supabase.from('bookings').select(`
      *,
      time_only,
      property_details,
      oven_size,
      access,
      hours_required,
      recommended_hours,
      ironing_hours,
      cleaners!bookings_cleaner_fkey (
        id,
        first_name,
        last_name
      ),
      customers!bookings_customer_fkey (
        id,
        first_name,
        last_name
      )
    `);

  if (dashboardDateFilter) {
    if (filterBySubmissionDate) {
      const dateFrom = dashboardDateFilter.dateFrom.split('T')[0];
      const dateTo = dashboardDateFilter.dateTo.split('T')[0];
      bookingsQuery = bookingsQuery
        .gte('date_submited', dateFrom)
        .lte('date_submited', dateTo + 'T23:59:59');
    } else {
      bookingsQuery = bookingsQuery
        .gte('date_time', dashboardDateFilter.dateFrom)
        .lte('date_time', dashboardDateFilter.dateTo);
    }
  }

  const { data: bookingsData, error: bookingsError } = await bookingsQuery.order(
    'date_time',
    { ascending: true },
  );

  if (bookingsError) {
    throw new Error('Failed to load bookings: ' + bookingsError.message);
  }

  const bookingIds = (bookingsData || []).map((b) => b.id);
  const primaryCleanersData: Record<
    number,
    { cleanerId: number; calculatedPay: number }
  > = {};
  const additionalCleanersData: Record<
    number,
    { count: number; totalPay: number; totalHours: number }
  > = {};

  if (bookingIds.length > 0) {
    const { data: bookingCleanersData } = await supabase
      .from('cleaner_payments')
      .select('booking_id, cleaner_id, calculated_pay, hours_assigned, is_primary')
      .in('booking_id', bookingIds);

    bookingCleanersData?.forEach((cleaner) => {
      if (cleaner.is_primary) {
        primaryCleanersData[cleaner.booking_id] = {
          cleanerId: cleaner.cleaner_id,
          calculatedPay: cleaner.calculated_pay || 0,
        };
      } else {
        if (!additionalCleanersData[cleaner.booking_id]) {
          additionalCleanersData[cleaner.booking_id] = {
            count: 0,
            totalPay: 0,
            totalHours: 0,
          };
        }
        additionalCleanersData[cleaner.booking_id].count += 1;
        additionalCleanersData[cleaner.booking_id].totalPay +=
          cleaner.calculated_pay || 0;
        additionalCleanersData[cleaner.booking_id].totalHours +=
          cleaner.hours_assigned || 0;
      }
    });
  }

  const bookings: BookingListItem[] = (bookingsData || []).map((booking) => {
    const primaryData = primaryCleanersData[booking.id];
    const additionalData = additionalCleanersData[booking.id];
    const cleanerPay = primaryData
      ? primaryData.calculatedPay
      : booking.cleaner_pay || 0;

    return {
      ...booking,
      cleaner_pay: cleanerPay,
      sub_cleaners_count: additionalData?.count || 0,
      sub_cleaners_total_pay: additionalData?.totalPay || 0,
    };
  });

  let cleaners: CleanerOption[] = [];
  if (includeCleaners) {
    const { data: cleanersData, error: cleanersError } = await supabase
      .from('cleaners')
      .select('id, first_name, last_name')
      .order('first_name');

    if (cleanersError) {
      throw new Error('Failed to load cleaners: ' + cleanersError.message);
    }
    cleaners = cleanersData || [];
  }

  const { data: customersData, error: customersError } = await supabase
    .from('customers')
    .select('id, source');

  if (customersError) {
    throw new Error('Failed to load customer sources: ' + customersError.message);
  }

  const customerSourceMap: Record<number, string> = {};
  const customerIdsInBookings = new Set(
    (bookingsData || []).map((b) => b.customer).filter(Boolean),
  );
  const sourcesWithBookings = new Set<string>();

  customersData?.forEach((c) => {
    if (c.source) {
      customerSourceMap[c.id] = c.source;
      if (customerIdsInBookings.has(c.id)) {
        sourcesWithBookings.add(c.source);
      }
    }
  });

  return {
    bookings,
    cleaners,
    customerSourceMap,
    availableSources: Array.from(sourcesWithBookings).sort(),
  };
}

export async function fetchCustomerPaymentMethodIds(
  customerIds: number[],
): Promise<Set<number>> {
  if (customerIds.length === 0) {
    return new Set();
  }

  const { data, error } = await supabase
    .from('customer_payment_methods')
    .select('customer_id')
    .in('customer_id', customerIds);

  if (error) {
    throw new Error('Failed to load payment methods: ' + error.message);
  }

  return new Set(data?.map((pm) => pm.customer_id) || []);
}
