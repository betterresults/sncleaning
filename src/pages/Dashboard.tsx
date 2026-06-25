import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShellPage } from '@/layouts/shell';
import DashboardStats from '@/components/admin/DashboardStats';
import BookingsListView from '@/components/bookings/BookingsListView';
import RecentActivity from '@/components/dashboard/RecentActivity';
import PerformanceChart from '@/components/dashboard/PerformanceChart';
import { Calendar, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { userRole } = useAuth();
  const navigate = useNavigate();

  const getTodayRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return {
      dateFrom: today.toISOString(),
      dateTo: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString(),
    };
  };

  const getNext7DaysRange = () => {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const next7Days = new Date(tomorrow.getTime() + 7 * 24 * 60 * 60 * 1000);
    return {
      dateFrom: tomorrow.toISOString(),
      dateTo: next7Days.toISOString(),
    };
  };

  const todayRange = getTodayRange();
  const next7DaysRange = getNext7DaysRange();

  return (
    <ShellPage width="full">
      {userRole === 'admin' && <DashboardStats />}

      <Card className="rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-0">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Today's Bookings
          </CardTitle>
          <Button
            onClick={() => navigate('/admin-add-booking')}
            className="flex items-center gap-2 rounded-full px-6 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 hover:from-gray-200 hover:to-gray-300 shadow-md hover:shadow-lg transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            New Booking
          </Button>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 pb-4">
          <BookingsListView
            dashboardDateFilter={todayRange}
            showPagination={false}
            maxItems={5}
          />
        </CardContent>
      </Card>

      <Card className="rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-semibold">Bookings for Next 7 Days</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 pb-4">
          <BookingsListView dashboardDateFilter={next7DaysRange} />
        </CardContent>
      </Card>

      {userRole === 'admin' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentActivity />
          <PerformanceChart />
        </div>
      )}
    </ShellPage>
  );
};

export default Dashboard;
