import { AlertTriangle, Calendar, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PastBookingListItem } from '@/api/bookings';

interface PastBookingsListStatsProps {
  bookings: PastBookingListItem[];
}

export function PastBookingsListStats({ bookings }: PastBookingsListStatsProps) {
  const activeBookings = bookings.filter((booking) => {
    const status = booking.booking_status?.toLowerCase();
    return status !== 'cancelled' && status !== 'canceled';
  });

  const stats = {
    totalBookings: activeBookings.length,
    totalRevenue: activeBookings.reduce(
      (sum, booking) => sum + (parseFloat(String(booking.total_cost)) || 0),
      0,
    ),
    unpaidCount: activeBookings.filter(
      (booking) =>
        booking.payment_status === 'Unpaid' || booking.payment_status === 'Not Paid',
    ).length,
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
      <Card className="rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-0 bg-gradient-to-br from-teal-500 via-teal-600 to-cyan-700 text-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 pt-3 sm:px-4 sm:pt-4">
          <CardTitle className="text-sm font-medium opacity-90">Bookings</CardTitle>
          <div className="p-1.5 bg-white/20 rounded-lg">
            <Calendar className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent className="pb-3 px-3 sm:pb-4 sm:px-4">
          <div className="text-3xl sm:text-4xl font-bold">{stats.totalBookings}</div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-0 bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700 text-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 pt-3 sm:px-4 sm:pt-4">
          <CardTitle className="text-sm font-medium opacity-90">Revenue</CardTitle>
          <div className="p-1.5 bg-white/20 rounded-lg">
            <DollarSign className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent className="pb-3 px-3 sm:pb-4 sm:px-4">
          <div className="text-2xl sm:text-3xl font-bold">£{stats.totalRevenue.toFixed(2)}</div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-0 bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 text-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 pt-3 sm:px-4 sm:pt-4">
          <CardTitle className="text-sm font-medium opacity-90">Unpaid</CardTitle>
          <div className="p-1.5 bg-white/20 rounded-lg">
            <AlertTriangle className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent className="pb-3 px-3 sm:pb-4 sm:px-4">
          <div className="text-3xl sm:text-4xl font-bold">{stats.unpaidCount}</div>
        </CardContent>
      </Card>
    </div>
  );
}
