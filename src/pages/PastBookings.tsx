import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import PastBookingsListView from '@/components/bookings/PastBookingsListView';
import { ShellLoading, ShellPage } from '@/layouts/shell';

const PastBookings = () => {
  const { user, userRole, signOut } = useAuth();

  // Allow admin and sales_agent

  return (
    <ShellPage width="wide">
                <PastBookingsListView showStatsForAdmin={userRole === 'admin'} />
              </ShellPage>
  );
};

export default PastBookings;