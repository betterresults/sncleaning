import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, TrendingUp, Clock } from 'lucide-react';
import { useQuickStats } from '@/hooks/queries/useDashboardStats';

const QuickStats = () => {
  const { data: stats, isLoading } = useQuickStats();

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-0 hover:shadow-[0_12px_40px_rgb(0,0,0,0.18)] hover:-translate-y-1 transition-all duration-200">
        <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
          <CardTitle className="text-sm font-medium text-gray-600">Upcoming</CardTitle>
          <Calendar className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-2xl font-bold text-gray-900">{stats.upcomingBookings}</div>
          <p className="text-xs text-gray-500 mt-1">Next 30 days</p>
        </CardContent>
      </Card>

      <Card className="rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-0 hover:shadow-[0_12px_40px_rgb(0,0,0,0.18)] hover:-translate-y-1 transition-all duration-200">
        <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
          <CardTitle className="text-sm font-medium text-gray-600">Active Cleaners</CardTitle>
          <Users className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-2xl font-bold text-gray-900">{stats.activeCleaners}</div>
          <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
        </CardContent>
      </Card>

      <Card className="rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-0 hover:shadow-[0_12px_40px_rgb(0,0,0,0.18)] hover:-translate-y-1 transition-all duration-200">
        <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
          <CardTitle className="text-sm font-medium text-gray-600">Avg Value</CardTitle>
          <TrendingUp className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-2xl font-bold text-gray-900">£{stats.avgBookingValue.toFixed(0)}</div>
          <p className="text-xs text-gray-500 mt-1">Per booking</p>
        </CardContent>
      </Card>

      <Card className="rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-0 hover:shadow-[0_12px_40px_rgb(0,0,0,0.18)] hover:-translate-y-1 transition-all duration-200">
        <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
          <CardTitle className="text-sm font-medium text-gray-600">Completion</CardTitle>
          <Clock className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-2xl font-bold text-gray-900">{stats.completionRate}%</div>
          <p className="text-xs text-gray-500 mt-1">Success rate</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickStats;
