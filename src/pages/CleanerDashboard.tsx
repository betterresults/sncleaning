import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { UnifiedHeader } from '@/components/UnifiedHeader';
import { cleanerNavigation } from '@/lib/navigationItems';
import { useAdminCleaner } from '@/contexts/AdminCleanerContext';
import AdminCleanerSelector from '@/components/admin/AdminCleanerSelector';
import CleanerUpcomingBookings from '@/components/cleaner/CleanerUpcomingBookings';
import CleanerBottomNav from '@/components/cleaner/CleanerBottomNav';
import CleanerTopNav from '@/components/cleaner/CleanerTopNav';
import { isCapacitor } from '@/utils/capacitor';
import { useIsMobile } from '@/hooks/use-mobile';

const CleanerDashboard = () => {
  const { user, userRole, customerId, cleanerId, loading, signOut } = useAuth();
  const { selectedCleanerId } = useAdminCleaner();
  const isMobile = useIsMobile();
  
  // Determine mobile view BEFORE any conditional returns
  const isMobileView = isCapacitor() || isMobile;
  
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-base">Loading dashboard...</div>
      </div>
    );
  }

  // Allow users with role 'user' who have a cleanerId, or admins
  if (!user || (userRole !== 'user' && userRole !== 'admin') || (userRole === 'user' && !cleanerId)) {
    return <Navigate to="/auth" replace />;
  }

  if (isMobileView) {
    return (
      <div className="min-h-screen bg-background">
        <CleanerTopNav />
        
        <main className="pt-header-safe pb-20 content-bottom-spacer">
          <div className="p-4">
            {userRole === 'admin' && (
              <div className="mb-4">
                <AdminCleanerSelector />
              </div>
            )}
            <CleanerUpcomingBookings />
          </div>
        </main>
        
        <CleanerBottomNav />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col w-full bg-gray-50 overflow-x-hidden">
        <UnifiedHeader 
          title=""
          user={user}
          userRole={userRole}
          showBackToAdmin={userRole === 'admin'}
          onSignOut={handleSignOut}
        />
        <div className="flex flex-1 w-full">
          <UnifiedSidebar
            navigationItems={cleanerNavigation}
            user={user}
            userRole={userRole}
            customerId={customerId}
            cleanerId={cleanerId}
            onSignOut={handleSignOut}
          />
          <SidebarInset className="flex-1 overflow-x-hidden max-w-full">
            <main className="flex-1 w-full max-w-full overflow-x-hidden">
              <div className="p-2 sm:p-4 space-y-3 sm:space-y-4 max-w-full">
                {userRole === 'admin' && (
                  <div className="mb-3 sm:mb-4">
                    <AdminCleanerSelector />
                  </div>
                )}
                <CleanerUpcomingBookings />
              </div>
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default CleanerDashboard;