import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { UnifiedHeader } from '@/components/UnifiedHeader';
import { cleanerNavigation } from '@/lib/navigationItems';
import { useAdminCleaner } from '@/contexts/AdminCleanerContext';
import AdminCleanerSelector from '@/components/admin/AdminCleanerSelector';
import CleanerEarnings from '@/components/cleaner/CleanerEarnings';
import CleanerBottomNav from '@/components/cleaner/CleanerBottomNav';
import { isCapacitor } from '@/utils/capacitor';
import { useIsMobile } from '@/hooks/use-mobile';

const CleanerEarningsPage = () => {
  const { user, userRole, cleanerId, loading, signOut } = useAuth();

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
        <div className="text-base">Loading earnings...</div>
      </div>
    );
  }

  // Allow users with role 'user' who have a cleanerId, or admins
  if (!user || (userRole !== 'user' && userRole !== 'admin') || (userRole === 'user' && !cleanerId)) {
    return <Navigate to="/auth" replace />;
  }

  const isMobile = useIsMobile();
  const isMobileView = isCapacitor() || isMobile;

  // Mobile view for native app and mobile browsers
  if (isMobileView) {
    return (
      <div className="min-h-screen bg-background content-bottom-spacer">
        {/* Content */}
        <div className="p-4">
          <CleanerEarnings />
        </div>

        <CleanerBottomNav />
      </div>
    );
  }

  // Desktop view with sidebar
  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col w-full bg-gray-50 pb-24">
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
                <CleanerEarnings />
              </div>
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default CleanerEarningsPage;