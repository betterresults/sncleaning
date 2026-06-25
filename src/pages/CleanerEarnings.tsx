import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCleaner } from '@/contexts/AdminCleanerContext';
import AdminCleanerSelector from '@/components/admin/AdminCleanerSelector';
import CleanerEarnings from '@/components/cleaner/CleanerEarnings';
import CleanerBottomNav from '@/components/cleaner/CleanerBottomNav';
import CleanerTopNav from '@/components/cleaner/CleanerTopNav';
import { isCapacitor } from '@/utils/capacitor';
import { useIsMobile } from '@/hooks/use-mobile';

const CleanerEarningsPage = () => {
  const { user, userRole, cleanerId, loading, signOut } = useAuth();
  const isMobile = useIsMobile();
  
  // Determine mobile view BEFORE any conditional returns
  const isMobileView = isCapacitor() || isMobile;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-base">Loading earnings...</div>
      </div>
    );
  }

  // Allow users with role 'user' who have a cleanerId, or admins

  // Mobile view for native app and mobile browsers
  if (isMobileView) {
    return (
      <div className="min-h-screen bg-background">
        <CleanerTopNav />
        
        <main className="pt-header-safe pb-20 content-bottom-spacer">
          <div className="p-4 pt-2">
            {userRole === 'admin' && <AdminCleanerSelector />}
            <CleanerEarnings />
          </div>
        </main>

        <CleanerBottomNav />
      </div>
    );
  }

  // Desktop view with sidebar
  return (
<div className="max-w-7xl mx-auto">
                {userRole === 'admin' && <AdminCleanerSelector />}
                <CleanerEarnings />
              </div>
  );
};

export default CleanerEarningsPage;