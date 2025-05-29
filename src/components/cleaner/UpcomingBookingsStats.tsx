
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
      <Card className="bg-gradient-to-br from-slate-50 to-blue-50 border border-blue-100 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-700">Upcoming Bookings</CardTitle>
          <CalendarDays className="h-5 w-5 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-900">{stats.totalBookings}</div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-700">Expected Earnings</CardTitle>
          <Banknote className="h-5 w-5 text-emerald-600" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-900">£{stats.totalEarnings.toFixed(2)}</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UpcomingBookingsStats;
