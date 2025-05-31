
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, DollarSign, AlertTriangle } from 'lucide-react';

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
          <Card key={i} className="shadow-lg">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
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
      <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-100 hover:shadow-xl transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-blue-700">
            {filters ? 'Filtered' : 'Upcoming'} Bookings
          </CardTitle>
          <Calendar className="h-5 w-5 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-900">
            {filters ? stats.filteredBookings : stats.upcomingBookings}
          </div>
          <p className="text-xs text-blue-600 mt-1">
            {filters ? 'Based on current filters' : 'Next 30 days'}
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-lg border-0 bg-gradient-to-br from-emerald-50 to-green-100 hover:shadow-xl transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-emerald-700">
            {filters ? 'Filtered' : 'Expected'} Revenue
          </CardTitle>
          <DollarSign className="h-5 w-5 text-emerald-600" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-emerald-900">
            £{((filters ? stats.filteredRevenue : stats.expectedRevenue) || 0).toFixed(2)}
          </div>
          <p className="text-xs text-emerald-600 mt-1">
            {filters ? 'From filtered bookings' : 'From upcoming bookings'}
          </p>
        </CardContent>
      </Card>

      {hasUnassigned && (
        <Card className="shadow-lg border-0 bg-gradient-to-br from-red-50 to-rose-100 hover:shadow-xl transition-all duration-300 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-red-700">
              Unassigned Jobs
            </CardTitle>
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-900">
              {stats.unassignedBookings}
            </div>
            <p className="text-xs text-red-600 mt-1">
              Require cleaner assignment
            </p>
          </CardContent>
        </Card>
      )}

      {!hasUnassigned && (
        <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-violet-100 hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-purple-700">Total Customers</CardTitle>
            <Calendar className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900">{stats.totalCustomers}</div>
            <p className="text-xs text-purple-600 mt-1">Active customers</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardStats;
