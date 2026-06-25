import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import CleanerTodayBookingsList from '@/components/cleaner/CleanerTodayBookingsList';
import AdminCleanerSelector from '@/components/admin/AdminCleanerSelector';
import { ShellLoading, ShellPage } from '@/layouts/shell';

const CleanerTodayBookings = () => {
  const { user, userRole, cleanerId, loading, signOut } = useAuth();
  
  // Check if admin is viewing this dashboard

  const isAdminViewing = userRole === 'admin';

  if (loading) {
    return <ShellLoading />;
  }

  // Allow users with role 'user' who have a cleanerId, or admins

  // Get first name for greeting
  const firstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Cleaner';

  return (
    <ShellPage width="wide">
                {isAdminViewing && <AdminCleanerSelector />}
                <CleanerTodayBookingsList />
              </ShellPage>
  );
};

export default CleanerTodayBookings;