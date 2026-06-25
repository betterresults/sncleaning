import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import CleanerTodayBookingsList from '@/components/cleaner/CleanerTodayBookingsList';
import AdminCleanerSelector from '@/components/admin/AdminCleanerSelector';

const CleanerTodayBookings = () => {
  const { user, userRole, cleanerId, loading, signOut } = useAuth();
  
  // Check if admin is viewing this dashboard

  const isAdminViewing = userRole === 'admin';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-base">Loading today's bookings...</div>
      </div>
    );
  }

  // Allow users with role 'user' who have a cleanerId, or admins

  // Get first name for greeting
  const firstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Cleaner';

  return (
<div className="max-w-7xl mx-auto">
                {isAdminViewing && <AdminCleanerSelector />}
                <CleanerTodayBookingsList />
              </div>
  );
};

export default CleanerTodayBookings;