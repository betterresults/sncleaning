import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import UpcomingBookings from '@/components/dashboard/UpcomingBookings';

const UpcomingBookingsPage = () => {
  const { user, userRole, cleanerId, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Redirect cleaners to their dashboard

  // Allow admin and sales_agent

  // No date filter means show ALL future bookings
  const noDateFilter = undefined;

  return (
<div className="max-w-7xl mx-auto">
                <UpcomingBookings 
                  dashboardDateFilter={noDateFilter}
                />
              </div>
  );
};

export default UpcomingBookingsPage;