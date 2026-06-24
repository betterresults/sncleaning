import { supabase } from '@/integrations/supabase/client';
import type {
  BookingPeriodStats,
  DashboardStatsFilters,
  QuickStatsData,
} from './types';

export async function fetchQuickStats(): Promise<QuickStatsData> {
  const next30Days = new Date();
  next30Days.setDate(next30Days.getDate() + 30);

  const { count: upcomingCount } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .gte('date_time', new Date().toISOString())
    .lte('date_time', next30Days.toISOString());

  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);

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
  const now = new Date();
  let dateFrom: string;
  let dateTo: string;

  if (filters?.dateFrom && filters?.dateTo) {
    dateFrom = filters.dateFrom;
    dateTo = filters.dateTo;
  } else {
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    dateFrom = thirtyDaysAgo.toISOString();
    dateTo = now.toISOString();
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

  const dateFrom = firstDay.toISOString().split('T')[0];
  const dateTo = lastDay.toISOString().split('T')[0];

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
