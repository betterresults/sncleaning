import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  ShellPage,
  ShellSectionHeader,
  ShellDivideBlock,
  ShellSplitCell,
} from '@/layouts/shell';
import DashboardStats from '@/components/admin/DashboardStats';
import BookingsListView from '@/components/bookings/BookingsListView';
import RecentActivity from '@/components/dashboard/RecentActivity';
import PerformanceChart from '@/components/dashboard/PerformanceChart';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getUKTodayRange } from '@/lib/ukTime';

const Dashboard = () => {
  const { userRole } = useAuth();
  const navigate = useNavigate();

  const getTodayRange = () => {
    const { start, end } = getUKTodayRange();
    return {
      dateFrom: start,
      dateTo: end,
    };
  };

  const getNext7DaysRange = () => {
    const { end: todayEnd } = getUKTodayRange();
    const tomorrow = new Date(new Date(todayEnd).getTime() + 1);
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

      <ShellDivideBlock>
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
      </ShellDivideBlock>

      <ShellDivideBlock>
        <ShellSectionHeader
          title="Next 7 Days"
          description="Upcoming scheduled bookings"
        />
        <BookingsListView dashboardDateFilter={next7DaysRange} />
      </ShellDivideBlock>

      {userRole === 'admin' && (
        <ShellDivideBlock split>
          <ShellSplitCell>
            <ShellSectionHeader
              title="Recent Activity"
              description="Latest completed jobs"
            />
            <RecentActivity />
          </ShellSplitCell>

          <ShellSplitCell>
            <ShellSectionHeader
              title="Performance"
              description="Last 7 days"
            />
            <PerformanceChart />
          </ShellSplitCell>
        </ShellDivideBlock>
      )}
    </ShellPage>
  );
};

export default Dashboard;
