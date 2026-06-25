import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import PastBookingsListView from '@/components/bookings/PastBookingsListView';

const CancelledBookings = () => {
  const { user, userRole, signOut } = useAuth();

  // Allow admin and sales_agent

  return (
<div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <h1 className="text-2xl font-bold text-foreground">Cancelled Bookings</h1>
                </div>
                <PastBookingsListView showOnlyCancelled={true} />
              </div>
  );
};

export default CancelledBookings;
