import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import PastBookingsListView from '@/components/bookings/PastBookingsListView';

const PastBookings = () => {
  const { user, userRole, signOut } = useAuth();

  // Allow admin and sales_agent

  return (
<div className="max-w-7xl mx-auto space-y-6">
                <PastBookingsListView showStatsForAdmin={userRole === 'admin'} />
              </div>
  );
};

export default PastBookings;