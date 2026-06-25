import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ShellLoading, ShellPage } from '@/layouts/shell';
import UpcomingBookings from '@/components/dashboard/UpcomingBookings';

const UpcomingBookingsPage = () => {
  const { loading } = useAuth();

  if (loading) {
    return <ShellLoading message="Loading bookings…" />;
  }

  return (
    <ShellPage width="wide">
      <UpcomingBookings dashboardDateFilter={undefined} />
    </ShellPage>
  );
};

export default UpcomingBookingsPage;
