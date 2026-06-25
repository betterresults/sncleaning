import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ShellPage, ShellSectionHeader } from '@/layouts/shell';
import DashboardStats from '@/components/admin/DashboardStats';
import BookingsListView from '@/components/bookings/BookingsListView';
import RecentActivity from '@/components/dashboard/RecentActivity';
import PerformanceChart from '@/components/dashboard/PerformanceChart';
import { Plus } from 'lucide-react';
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

      <div className="shell-divide-block">
        <ShellSectionHeader
          title="Today's Bookings"
          description="Scheduled for today"
          action={
            <Button size="sm" variant="outline" onClick={() => navigate('/admin-add-booking')}>
              <Plus className="h-4 w-4" />
              New Booking
            </Button>
          }
        />
        <BookingsListView
          dashboardDateFilter={todayRange}
          showPagination={false}
          maxItems={5}
        />
      </div>

      <div className="shell-divide-block">
        <ShellSectionHeader
          title="Next 7 Days"
          description="Upcoming scheduled bookings"
        />
        <BookingsListView dashboardDateFilter={next7DaysRange} />
      </div>

      {userRole === 'admin' && (
        <div className="shell-divide-block shell-split-grid">
          <div className="shell-split-cell">
            <ShellSectionHeader
              title="Recent Activity"
              description="Latest completed jobs"
            />
            <RecentActivity />
          </div>

          <div className="shell-split-cell">
            <ShellSectionHeader
              title="Performance"
              description="Last 7 days"
            />
            <PerformanceChart />
          </div>
        </div>
      )}
    </ShellPage>
  );
};

export default Dashboard;
