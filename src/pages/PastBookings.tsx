import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import PastBookingsListView from '@/components/bookings/PastBookingsListView';
import { ShellPage } from '@/layouts/shell';

const PastBookings = () => {
  const { userRole } = useAuth();
  const [searchParams] = useSearchParams();
  const openBookingId = Number.parseInt(searchParams.get('bookingId') || '', 10);
  const bookingId = Number.isFinite(openBookingId) ? openBookingId : undefined;

  return (
    <ShellPage width="wide">
      <PastBookingsListView
        showStatsForAdmin={userRole === 'admin'}
        openBookingId={bookingId}
      />
    </ShellPage>
  );
};

export default PastBookings;