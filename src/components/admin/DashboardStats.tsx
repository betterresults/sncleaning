
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Stats {
  upcomingBookings: number;
  expectedRevenue: number;
  totalCustomers: number;
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
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Base query for upcoming bookings
      let bookingsQuery = supabase
        .from('bookings')
        .select('total_cost, payment_status, customer')
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
      const expectedRevenue = bookings?.reduce((sum, booking) => {
        return sum + (parseFloat(booking.total_cost) || 0);
      }, 0) || 0;

      setStats({
        upcomingBookings,
        expectedRevenue,
        totalCustomers: customersCount || 0,
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {filters ? 'Filtered' : 'Upcoming'} Bookings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {filters ? stats.filteredBookings : stats.upcomingBookings}
          </div>
          <p className="text-xs text-muted-foreground">
            {filters ? 'Based on current filters' : 'Next 30 days'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {filters ? 'Filtered' : 'Expected'} Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            £{(filters ? stats.filteredRevenue : stats.expectedRevenue)?.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            {filters ? 'From filtered bookings' : 'From upcoming bookings'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalCustomers}</div>
          <p className="text-xs text-muted-foreground">Active customers</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardStats;
