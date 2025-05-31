
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, DollarSign, AlertTriangle, TrendingUp } from 'lucide-react';

interface Stats {
  upcomingBookings: number;
  expectedRevenue: number;
  totalCustomers: number;
  unassignedBookings: number;
  filteredBookings?: number;
  filteredRevenue?: number;
}

interface DashboardStatsProps {
  filters?: {
    dateFrom?: string;
    dateTo?: string;
    cleanerId?: number;
    customerId?: number;
  };
}

const DashboardStats = ({ filters }: DashboardStatsProps) => {
  const [stats, setStats] = useState<Stats>({
    upcomingBookings: 0,
    expectedRevenue: 0,
    totalCustomers: 0,
    unassignedBookings: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Base query for upcoming bookings
      let bookingsQuery = supabase
        .from('bookings')
        .select('total_cost, payment_status, customer, cleaner')
        .gte('date_time', new Date().toISOString());

      // Apply filters if provided
      if (filters?.dateFrom) {
        bookingsQuery = bookingsQuery.gte('date_time', filters.dateFrom);
      }
      if (filters?.dateTo) {
        bookingsQuery = bookingsQuery.lte('date_time', filters.dateTo);
      }
      if (filters?.cleanerId) {
        bookingsQuery = bookingsQuery.eq('cleaner', filters.cleanerId);
      }
      if (filters?.customerId) {
        bookingsQuery = bookingsQuery.eq('customer', filters.customerId);
      }

      const { data: bookings, error: bookingsError } = await bookingsQuery;

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        return;
      }

      // Get total customers count
      const { count: customersCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });

      // Calculate stats
      const upcomingBookings = bookings?.length || 0;
      const unassignedBookings = bookings?.filter(booking => !booking.cleaner).length || 0;
      const expectedRevenue = bookings?.reduce((sum, booking) => {
        return sum + (parseFloat(String(booking.total_cost)) || 0);
      }, 0) || 0;

      setStats({
        upcomingBookings,
        expectedRevenue,
        totalCustomers: customersCount || 0,
        unassignedBookings,
        filteredBookings: filters ? upcomingBookings : undefined,
        filteredRevenue: filters ? expectedRevenue : undefined,
      });

    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [filters]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="shadow-lg border-0 bg-gradient-to-br from-gray-50 to-gray-100">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const hasUnassigned = stats.unassignedBookings > 0;
  
  return (
    <div className={`grid grid-cols-1 gap-6 ${hasUnassigned ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
      <Card className="shadow-xl border-0 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 text-white hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium opacity-90">
            {filters ? 'Filtered' : 'Upcoming'} Bookings
          </CardTitle>
          <div className="p-2 bg-white/20 rounded-lg">
            <Calendar className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold mb-1">
            {filters ? stats.filteredBookings : stats.upcomingBookings}
          </div>
          <p className="text-xs opacity-80">
            {filters ? 'Based on current filters' : 'Next 30 days'}
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-xl border-0 bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700 text-white hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium opacity-90">
            {filters ? 'Filtered' : 'Expected'} Revenue
          </CardTitle>
          <div className="p-2 bg-white/20 rounded-lg">
            <DollarSign className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold mb-1">
            £{((filters ? stats.filteredRevenue : stats.expectedRevenue) || 0).toFixed(2)}
          </div>
          <p className="text-xs opacity-80">
            {filters ? 'From filtered bookings' : 'From upcoming bookings'}
          </p>
        </CardContent>
      </Card>

      {hasUnassigned && (
        <Card className="shadow-xl border-0 bg-gradient-to-br from-red-500 via-red-600 to-rose-700 text-white hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium opacity-90">
              Unassigned Jobs
            </CardTitle>
            <div className="p-2 bg-white/20 rounded-lg animate-pulse">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">
              {stats.unassignedBookings}
            </div>
            <p className="text-xs opacity-80">
              Require immediate attention
            </p>
          </CardContent>
        </Card>
      )}

      {!hasUnassigned && (
        <Card className="shadow-xl border-0 bg-gradient-to-br from-purple-500 via-violet-600 to-purple-700 text-white hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium opacity-90">Total Customers</CardTitle>
            <div className="p-2 bg-white/20 rounded-lg">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">{stats.totalCustomers}</div>
            <p className="text-xs opacity-80">Active customers</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardStats;
