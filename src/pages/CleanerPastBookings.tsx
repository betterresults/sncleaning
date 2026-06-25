import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCleaner } from '@/contexts/AdminCleanerContext';
import AdminCleanerSelector from '@/components/admin/AdminCleanerSelector';
import CleanerPastBookings from '@/components/cleaner/CleanerPastBookings';
import { ShellLoading, ShellPage } from '@/layouts/shell';

const CleanerPastBookingsPage = () => {
  const { user, userRole, cleanerId, loading, signOut } = useAuth();

  if (loading) {
    return <ShellLoading />;
  }

  // Allow users with role 'user' who have a cleanerId, or admins

  return (
    <ShellPage width="wide">
                {userRole === 'admin' && <AdminCleanerSelector />}
                <CleanerPastBookings />
              </ShellPage>
  );
};

export default CleanerPastBookingsPage;