import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { getUKNowAsStoredDate, getUKNowAsStoredString, getUKTodayDateString } from '@/lib/ukTime';
import type {
  BookingPeriodStats,
  DashboardStatsFilters,
  QuickStatsData,
} from './types';

export async function fetchQuickStats(): Promise<QuickStatsData> {
  // `getUKNowAsStoredDate()` returns a Date whose *UTC* fields equal UK wall-clock
  // digits, so day-arithmetic must use the UTC setters/getters (not local ones) to
  // stay correct regardless of the viewer's device timezone.
  const next30Days = getUKNowAsStoredDate();
  next30Days.setUTCDate(next30Days.getUTCDate() + 30);

  const { count: upcomingCount } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .gte('date_time', getUKNowAsStoredString())
    .lte('date_time', next30Days.toISOString());

  const last30Days = getUKNowAsStoredDate();
  last30Days.setUTCDate(last30Days.getUTCDate() - 30);

  const { data: activeCleanersData } = await supabase
    .from('past_bookings')
    .select('cleaner')
    .gte('date_time', last30Days.toISOString())
    .not('cleaner', 'is', null);

  const uniqueCleaners = new Set(activeCleanersData?.map((b) => b.cleaner));

  const { data: recentBookings } = await supabase
    .from('past_bookings')
    .select('total_cost')
    .gte('date_time', last30Days.toISOString());

  const avgValue =
    recentBookings && recentBookings.length > 0
      ? recentBookings.reduce((sum, b) => sum + (Number(b.total_cost) || 0), 0) /
        recentBookings.length
      : 0;

  const { data: allRecentBookings } = await supabase
    .from('past_bookings')
    .select('booking_status')
    .gte('date_time', last30Days.toISOString());

  const completedCount =
    allRecentBookings?.filter((b) => b.booking_status === 'completed').length || 0;
  const totalCount = allRecentBookings?.length || 0;
  const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return {
    upcomingBookings: upcomingCount || 0,
    activeCleaners: uniqueCleaners.size,
    avgBookingValue: avgValue,
    completionRate: Math.round(completionRate),
  };
}

export async function fetchDashboardStats(
  filters?: DashboardStatsFilters,
): Promise<BookingPeriodStats> {
  let dateFrom: string;
  let dateTo: string;

  if (filters?.dateFrom && filters?.dateTo) {
    dateFrom = filters.dateFrom;
    dateTo = filters.dateTo;
  } else {
    // Anchor to UK "today" so the `date_only` slice below reflects the correct UK
    // calendar date regardless of the viewer's device timezone.
    const now = getUKNowAsStoredDate();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    dateFrom = thirtyDaysAgo.toISOString();
    dateTo = getUKTodayDateString();
  }

  let bookingsQuery = supabase
    .from('past_bookings')
    .select('total_cost, payment_status, date_only')
    .gte('date_only', dateFrom.split('T')[0])
    .lte('date_only', dateTo.split('T')[0]);

  if (filters?.cleanerId) {
    bookingsQuery = bookingsQuery.eq('cleaner', filters.cleanerId);
  }
  if (filters?.customerId) {
    bookingsQuery = bookingsQuery.eq('customer', filters.customerId);
  }

  const { data: bookingsData, error: bookingsError } = await bookingsQuery;

  if (bookingsError) {
    throw new Error('Failed to load dashboard stats: ' + bookingsError.message);
  }

  const totalBookings = bookingsData?.length || 0;
  const monthlyRevenue =
    bookingsData?.reduce((sum, booking) => {
      return sum + (parseFloat(String(booking.total_cost)) || 0);
    }, 0) || 0;
  const unpaidInvoices =
    bookingsData?.filter(
      (booking) =>
        booking.payment_status === 'Unpaid' || booking.payment_status === 'Not Paid',
    ).length || 0;

  return { totalBookings, monthlyRevenue, unpaidInvoices };
}

export async function fetchPastBookingsMonthlyStats(
  selectedMonth: string,
): Promise<BookingPeriodStats> {
  const [year, month] = selectedMonth.split('-').map(Number);
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);

  // `firstDay`/`lastDay` are built from local Y/M/D getters representing the intended
  // UK month (no real timezone meaning) — use date-fns `format()` (local getters) here,
  // not `.toISOString()`, which would convert through the device's real UTC offset and
  // shift the day for non-UK viewers.
  const dateFrom = format(firstDay, 'yyyy-MM-dd');
  const dateTo = format(lastDay, 'yyyy-MM-dd');

  const { data: bookingsData, error: bookingsError } = await supabase
    .from('past_bookings')
    .select('total_cost, payment_status, date_only, booking_status')
    .gte('date_only', dateFrom)
    .lte('date_only', dateTo);

  if (bookingsError) {
    throw new Error('Failed to load past booking stats: ' + bookingsError.message);
  }

  const activeBookings =
    bookingsData?.filter((booking) => {
      const status = booking.booking_status?.toLowerCase();
      return status !== 'cancelled' && status !== 'canceled';
    }) || [];

  const totalBookings = activeBookings.length;
  const monthlyRevenue = activeBookings.reduce((sum, booking) => {
    return sum + (parseFloat(String(booking.total_cost)) || 0);
  }, 0);
  const unpaidInvoices = activeBookings.filter(
    (booking) =>
      booking.payment_status === 'Unpaid' || booking.payment_status === 'Not Paid',
  ).length;

  return { totalBookings, monthlyRevenue, unpaidInvoices };
}
