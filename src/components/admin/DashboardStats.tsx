
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, DollarSign, AlertTriangle } from 'lucide-react';
import { useDashboardStats } from '@/hooks/queries/useDashboardStats';

interface DashboardStatsProps {
  filters?: {
    dateFrom?: string;
    dateTo?: string;
    cleanerId?: number;
    customerId?: number;
  };
}

const DashboardStats = ({ filters }: DashboardStatsProps) => {
  const { data: stats, isLoading } = useDashboardStats(filters);

  if (isLoading || !stats) {
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
