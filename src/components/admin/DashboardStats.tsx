
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, DollarSign, AlertTriangle, Banknote } from 'lucide-react';

interface Stats {
  upcomingBookings: number;
  expectedRevenue: number;
  totalCleanerPay: number;
  totalProfit: number;
  unassignedBookings: number;
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
    totalCleanerPay: 0,
    totalProfit: 0,
    unassignedBookings: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Base query for upcoming bookings
      let bookingsQuery = supabase
        .from('bookings')
        .select('total_cost, cleaner_pay, payment_status, customer, cleaner')
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

      // Calculate stats
      const upcomingBookings = bookings?.length || 0;
      const unassignedBookings = bookings?.filter(booking => !booking.cleaner).length || 0;
      
      // Debug logging
      console.log('DashboardStats debug:', {
        totalBookings: upcomingBookings,
        unassignedBookings,
        bookingsWithoutCleaner: bookings?.filter(booking => !booking.cleaner).map(b => ({
          id: b.customer,
          cleaner: b.cleaner,
          hasCleanerProperty: 'cleaner' in b
        }))
      });
      
      const expectedRevenue = bookings?.reduce((sum, booking) => {
        return sum + (parseFloat(String(booking.total_cost)) || 0);
      }, 0) || 0;
      const totalCleanerPay = bookings?.reduce((sum, booking) => {
        return sum + (parseFloat(String(booking.cleaner_pay)) || 0);
      }, 0) || 0;
      const totalProfit = expectedRevenue - totalCleanerPay;

      setStats({
        upcomingBookings,
        expectedRevenue,
        totalCleanerPay,
        totalProfit,
        unassignedBookings,
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
      <div className="space-y-3 sm:space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="shadow-lg border-0 bg-gradient-to-br from-gray-50 to-gray-100">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="animate-pulse">
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-6 sm:h-7 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {stats.unassignedBookings > 0 && (
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
        )}
      </div>
    );
  }
  
  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 text-white transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 pt-3 sm:px-4 sm:pt-4">
            <CardTitle className="text-sm font-medium opacity-90">
              Bookings
            </CardTitle>
            <div className="p-1.5 bg-white/20 rounded-lg">
              <Calendar className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="pb-3 px-3 sm:pb-4 sm:px-4">
            <div className="text-3xl sm:text-4xl font-bold">
              {stats.upcomingBookings}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700 text-white transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 pt-3 sm:px-4 sm:pt-4">
            <CardTitle className="text-sm font-medium opacity-90">
              Revenue
            </CardTitle>
            <div className="p-1.5 bg-white/20 rounded-lg">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="pb-3 px-3 sm:pb-4 sm:px-4">
            <div className="text-2xl sm:text-3xl font-bold">
              £{(stats.expectedRevenue || 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-gradient-to-br from-yellow-500 via-amber-600 to-orange-700 text-white transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 pt-3 sm:px-4 sm:pt-4">
            <CardTitle className="text-sm font-medium opacity-90">
              Profit
            </CardTitle>
            <div className="p-1.5 bg-white/20 rounded-lg">
              <Banknote className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="pb-3 px-3 sm:pb-4 sm:px-4">
            <div className="text-2xl sm:text-3xl font-bold">
              £{(stats.totalProfit || 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardStats;
