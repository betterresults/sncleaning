import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { UnifiedHeader } from '@/components/UnifiedHeader';
import { cleanerNavigation } from '@/lib/navigationItems';
import { useAdminCleaner } from '@/contexts/AdminCleanerContext';
import AdminCleanerSelector from '@/components/admin/AdminCleanerSelector';
import CleanerAvailableBookings from '@/components/cleaner/CleanerAvailableBookings';
import CleanerBottomNav from '@/components/cleaner/CleanerBottomNav';
import { isCapacitor } from '@/utils/capacitor';
import { useIsMobile } from '@/hooks/use-mobile';

const CleanerAvailableBookingsPage = () => {
  const { user, userRole, cleanerId, loading, signOut } = useAuth();
  const isMobile = useIsMobile();
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
        <div className="text-base">Loading available bookings...</div>
      </div>
    );
  }

  // Allow users with role 'user' who have a cleanerId, or admins
  if (!user || (userRole !== 'user' && userRole !== 'admin') || (userRole === 'user' && !cleanerId)) {
    return <Navigate to="/auth" replace />;
  }

  // Mobile/App view with bottom navigation
  if (isMobileView) {
    return (
      <div className="min-h-screen bg-background content-bottom-spacer">
        {/* Header - hidden in mobile view */}
        {!isMobileView && (
          <div className="sticky top-0 z-40 bg-background border-b border-border">
            <div className="px-4 py-4">
              <h1 className="text-2xl font-bold text-foreground">Available Jobs</h1>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-4">
          {userRole === 'admin' && <AdminCleanerSelector />}
          <CleanerAvailableBookings />
        </div>

        <CleanerBottomNav />
      </div>
    );
  }

  // Desktop view with sidebar
  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col w-full bg-gray-50">
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
            onSignOut={handleSignOut}
          />
          <SidebarInset className="flex-1">
            <main className="flex-1 p-4 space-y-4 max-w-full overflow-x-hidden">
              <div className="max-w-7xl mx-auto">
                {userRole === 'admin' && <AdminCleanerSelector />}
                <CleanerAvailableBookings />
              </div>
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default CleanerAvailableBookingsPage;