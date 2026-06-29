import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import PastBookingsListView from '@/components/bookings/PastBookingsListView';
import { ShellLoading, ShellPage } from '@/layouts/shell';

const CancelledBookings = () => {
  const { user, userRole, signOut } = useAuth();

  // Allow admin and sales_agent

  return (
    <ShellPage width="wide">
                <div className="flex items-center gap-3 mb-4">
                  <h1 className="text-2xl font-bold text-foreground">Cancelled Bookings</h1>
                </div>
                <PastBookingsListView showOnlyCancelled={true} />
              </ShellPage>
  );
};

export default CancelledBookings;
