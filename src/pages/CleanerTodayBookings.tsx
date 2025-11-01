import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { UnifiedHeader } from '@/components/UnifiedHeader';
import { cleanerNavigation } from '@/lib/navigationItems';
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
  if (!user || (userRole !== 'user' && userRole !== 'admin') || (userRole === 'user' && !cleanerId)) {
    return <Navigate to="/auth" replace />;
  }

  // Get first name for greeting
  const firstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Cleaner';

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col w-full bg-gray-50">
        <UnifiedHeader 
          title=""
          user={user}
          userRole={userRole}
          showBackToAdmin={isAdminViewing}
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
                {isAdminViewing && <AdminCleanerSelector />}
                <CleanerTodayBookingsList />
              </div>
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default CleanerTodayBookings;