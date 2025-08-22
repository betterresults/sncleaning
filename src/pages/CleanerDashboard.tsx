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
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const CleanerDashboard = () => {
  const { user, userRole, cleanerId, loading, signOut } = useAuth();
  const { selectedCleanerId } = useAdminCleaner();
  
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

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50 overflow-x-hidden">
        <UnifiedSidebar
          navigationItems={cleanerNavigation}
          user={user}
          onSignOut={handleSignOut}
        />
        <SidebarInset className="flex-1 overflow-x-hidden max-w-full">
          <UnifiedHeader 
            title="My Bookings 📅"
            user={user}
            userRole={userRole}
          />
          
          <main className="flex-1 w-full max-w-full overflow-x-hidden">
            <div className="p-2 sm:p-4 space-y-3 sm:space-y-4 max-w-full">
              {userRole === 'admin' && (
                <div className="mb-3 sm:mb-4 space-y-3">
                  <Button asChild variant="outline" size="sm" className="w-fit">
                    <Link to="/dashboard" className="flex items-center gap-2">
                      <ArrowLeft className="h-4 w-4" />
                      Back to Admin Dashboard
                    </Link>
                  </Button>
                  <AdminCleanerSelector />
                </div>
              )}
              <CleanerUpcomingBookings />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default CleanerDashboard;