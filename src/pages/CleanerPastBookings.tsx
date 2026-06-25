import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCleaner } from '@/contexts/AdminCleanerContext';
import AdminCleanerSelector from '@/components/admin/AdminCleanerSelector';
import CleanerPastBookings from '@/components/cleaner/CleanerPastBookings';

const CleanerPastBookingsPage = () => {
  const { user, userRole, cleanerId, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-base">Loading past bookings...</div>
      </div>
    );
  }

  // Allow users with role 'user' who have a cleanerId, or admins

  return (
<div className="max-w-7xl mx-auto">
                {userRole === 'admin' && <AdminCleanerSelector />}
                <CleanerPastBookings />
              </div>
  );
};

export default CleanerPastBookingsPage;