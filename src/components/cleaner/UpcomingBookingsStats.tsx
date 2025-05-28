
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Banknote } from 'lucide-react';
import { Stats } from './types';

interface UpcomingBookingsStatsProps {
  stats: Stats;
}

const UpcomingBookingsStats: React.FC<UpcomingBookingsStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-blue-700">My Upcoming Bookings</CardTitle>
          <CalendarDays className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-900">{stats.totalBookings}</div>
          <p className="text-xs text-blue-600">Scheduled bookings</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-green-700">Expected Earnings</CardTitle>
          <Banknote className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-900">£{stats.totalEarnings.toFixed(2)}</div>
          <p className="text-xs text-green-600">From upcoming bookings</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default UpcomingBookingsStats;
