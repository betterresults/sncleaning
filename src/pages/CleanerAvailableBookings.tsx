import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCleaner } from '@/contexts/AdminCleanerContext';
import AdminCleanerSelector from '@/components/admin/AdminCleanerSelector';
import CleanerAvailableBookings from '@/components/cleaner/CleanerAvailableBookings';
import CleanerBottomNav from '@/components/cleaner/CleanerBottomNav';
import CleanerTopNav from '@/components/cleaner/CleanerTopNav';
import { isCapacitor } from '@/utils/capacitor';
import { useIsMobile } from '@/hooks/use-mobile';
import { ShellLoading, ShellPage } from '@/layouts/shell';

const CleanerAvailableBookingsPage = () => {
  const { user, userRole, cleanerId, loading, signOut } = useAuth();
  const isMobile = useIsMobile();
  const isMobileView = isCapacitor() || isMobile;

  if (loading) {
    return <ShellLoading />;
  }

  // Allow users with role 'user' who have a cleanerId, or admins

  // Mobile/App view with bottom navigation
  if (isMobileView) {
    return (
      <div className="min-h-screen bg-background">
        <CleanerTopNav />

        <main className="pt-header-safe pb-20 content-bottom-spacer">
          <div className="p-4 pt-2">
            {userRole === 'admin' && <AdminCleanerSelector />}
            <CleanerAvailableBookings />
          </div>
        </main>

        <CleanerBottomNav />
      </div>
    );
  }

  return (
    <ShellPage width="wide">
      {userRole === 'admin' && <AdminCleanerSelector />}
      <CleanerAvailableBookings />
    </ShellPage>
  );
};

export default CleanerAvailableBookingsPage;