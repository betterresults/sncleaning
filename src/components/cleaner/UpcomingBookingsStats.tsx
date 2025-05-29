
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
      <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 text-white shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium opacity-90">Upcoming Bookings</CardTitle>
          <CalendarDays className="h-5 w-5 opacity-80" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.totalBookings}</div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-500 to-green-600 border-0 text-white shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium opacity-90">Expected Earnings</CardTitle>
          <Banknote className="h-5 w-5 opacity-80" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">£{stats.totalEarnings.toFixed(2)}</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UpcomingBookingsStats;
