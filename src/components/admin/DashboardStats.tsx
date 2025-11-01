
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, DollarSign, AlertTriangle, Banknote } from 'lucide-react';

interface Stats {
  totalBookings: number;
  monthlyRevenue: number;
  unpaidInvoices: number;
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
    totalBookings: 0,
    monthlyRevenue: 0,
    unpaidInvoices: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // If filters provided, use them; otherwise calculate last 30 days
      const now = new Date();
      let dateFrom: string;
      let dateTo: string;
      
      if (filters?.dateFrom && filters?.dateTo) {
        dateFrom = filters.dateFrom;
        dateTo = filters.dateTo;
      } else {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateFrom = thirtyDaysAgo.toISOString();
        dateTo = now.toISOString();
      }
      
      // Build query for past bookings in date range
      let bookingsQuery = supabase
        .from('past_bookings')
        .select('total_cost, payment_status, date_only')
        .gte('date_only', dateFrom.split('T')[0])
        .lte('date_only', dateTo.split('T')[0]);

      // Apply additional filters if provided
      if (filters?.cleanerId) {
        bookingsQuery = bookingsQuery.eq('cleaner', filters.cleanerId);
      }
      if (filters?.customerId) {
        bookingsQuery = bookingsQuery.eq('customer', filters.customerId);
      }

      const { data: bookingsData, error: bookingsError } = await bookingsQuery;

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        return;
      }

      // Calculate stats
      const totalBookings = bookingsData?.length || 0;
      const monthlyRevenue = bookingsData?.reduce((sum, booking) => {
        return sum + (parseFloat(String(booking.total_cost)) || 0);
      }, 0) || 0;
      const unpaidInvoices = bookingsData?.filter(booking => 
        booking.payment_status === 'Unpaid' || booking.payment_status === 'Not Paid'
      ).length || 0;

      setStats({
        totalBookings,
        monthlyRevenue,
        unpaidInvoices,
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
            <Card key={i} className="rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-0 bg-gradient-to-br from-gray-50 to-gray-100">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="animate-pulse">
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-6 sm:h-7 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card className="rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-0 bg-gradient-to-br from-teal-500 via-teal-600 to-cyan-700 text-white transition-all duration-200 hover:shadow-[0_12px_40px_rgb(0,0,0,0.18)] hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 pt-3 sm:px-4 sm:pt-4">
            <CardTitle className="text-sm font-medium opacity-90">
              Total Bookings
            </CardTitle>
            <div className="p-1.5 bg-white/20 rounded-lg">
              <Calendar className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="pb-3 px-3 sm:pb-4 sm:px-4">
            <div className="text-3xl sm:text-4xl font-bold">
              {stats.totalBookings}
            </div>
            <p className="text-xs opacity-75 mt-1">Last 30 Days</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-0 bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700 text-white transition-all duration-200 hover:shadow-[0_12px_40px_rgb(0,0,0,0.18)] hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 pt-3 sm:px-4 sm:pt-4">
            <CardTitle className="text-sm font-medium opacity-90">
              Monthly Revenue
            </CardTitle>
            <div className="p-1.5 bg-white/20 rounded-lg">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="pb-3 px-3 sm:pb-4 sm:px-4">
            <div className="text-2xl sm:text-3xl font-bold">
              £{(stats.monthlyRevenue || 0).toFixed(2)}
            </div>
            <p className="text-xs opacity-75 mt-1">Last 30 Days</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-0 bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 text-white transition-all duration-200 hover:shadow-[0_12px_40px_rgb(0,0,0,0.18)] hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 pt-3 sm:px-4 sm:pt-4">
            <CardTitle className="text-sm font-medium opacity-90">
              Unpaid Invoices
            </CardTitle>
            <div className="p-1.5 bg-white/20 rounded-lg">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="pb-3 px-3 sm:pb-4 sm:px-4">
            <div className="text-3xl sm:text-4xl font-bold">
              {stats.unpaidInvoices}
            </div>
            <p className="text-xs opacity-75 mt-1">Pending Payment</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardStats;
