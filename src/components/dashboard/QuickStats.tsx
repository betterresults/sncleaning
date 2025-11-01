import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, TrendingUp, Clock } from 'lucide-react';

interface QuickStatsData {
  upcomingBookings: number;
  activeCleaners: number;
  avgBookingValue: number;
  completionRate: number;
}

const QuickStats = () => {
  const [stats, setStats] = useState<QuickStatsData>({
    upcomingBookings: 0,
    activeCleaners: 0,
    avgBookingValue: 0,
    completionRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Upcoming bookings (next 30 days)
      const next30Days = new Date();
      next30Days.setDate(next30Days.getDate() + 30);

      const { count: upcomingCount } = await supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .gte('date_time', new Date().toISOString())
        .lte('date_time', next30Days.toISOString());

      // Active cleaners (cleaners with bookings in last 30 days)
      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);

      const { data: activeCleanersData } = await supabase
        .from('past_bookings')
        .select('cleaner')
        .gte('date_time', last30Days.toISOString())
        .not('cleaner', 'is', null);

      const uniqueCleaners = new Set(activeCleanersData?.map(b => b.cleaner));

      // Average booking value (last 30 days)
      const { data: recentBookings } = await supabase
        .from('past_bookings')
        .select('total_cost')
        .gte('date_time', last30Days.toISOString());

      const avgValue = recentBookings && recentBookings.length > 0
        ? recentBookings.reduce((sum, b) => sum + (Number(b.total_cost) || 0), 0) / recentBookings.length
        : 0;

      // Completion rate (percentage of completed vs cancelled in last 30 days)
      const { data: allRecentBookings } = await supabase
        .from('past_bookings')
        .select('booking_status')
        .gte('date_time', last30Days.toISOString());

      const completedCount = allRecentBookings?.filter(b => b.booking_status === 'completed').length || 0;
      const totalCount = allRecentBookings?.length || 0;
      const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

      setStats({
        upcomingBookings: upcomingCount || 0,
        activeCleaners: uniqueCleaners.size,
        avgBookingValue: avgValue,
        completionRate: Math.round(completionRate)
      });
    } catch (error) {
      console.error('Error fetching quick stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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
      <Card className="border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
          <CardTitle className="text-sm font-medium text-gray-600">Upcoming</CardTitle>
          <Calendar className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-2xl font-bold text-gray-900">{stats.upcomingBookings}</div>
          <p className="text-xs text-gray-500 mt-1">Next 30 days</p>
        </CardContent>
      </Card>

      <Card className="border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
          <CardTitle className="text-sm font-medium text-gray-600">Active Cleaners</CardTitle>
          <Users className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-2xl font-bold text-gray-900">{stats.activeCleaners}</div>
          <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
        </CardContent>
      </Card>

      <Card className="border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
          <CardTitle className="text-sm font-medium text-gray-600">Avg Value</CardTitle>
          <TrendingUp className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-2xl font-bold text-gray-900">£{stats.avgBookingValue.toFixed(0)}</div>
          <p className="text-xs text-gray-500 mt-1">Per booking</p>
        </CardContent>
      </Card>

      <Card className="border shadow-sm">
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
