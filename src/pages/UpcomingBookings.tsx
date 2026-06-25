import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import UpcomingBookings from '@/components/dashboard/UpcomingBookings';
import { ShellLoading, ShellPage } from '@/layouts/shell';

const UpcomingBookingsPage = () => {
  const { loading } = useAuth();
  const [searchParams] = useSearchParams();
  const openBookingId = Number.parseInt(searchParams.get('bookingId') || '', 10);
  const bookingId = Number.isFinite(openBookingId) ? openBookingId : undefined;

  if (loading) {
    return <ShellLoading message="Loading bookings…" />;
  }

  return (
    <ShellPage width="wide">
      <UpcomingBookings dashboardDateFilter={undefined} openBookingId={bookingId} />
    </ShellPage>
  );
};

export default UpcomingBookingsPage;
