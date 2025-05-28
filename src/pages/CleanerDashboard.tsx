

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { CleanerSidebar } from '@/components/CleanerSidebar';
import CleanerUpcomingBookings from '@/components/cleaner/CleanerUpcomingBookings';

const CleanerDashboard = () => {
  const { user, userRole, cleanerId, loading } = useAuth();

  console.log('CleanerDashboard - Auth state:', { user: !!user, userRole, cleanerId, loading });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading cleaner dashboard...</div>
      </div>
    );
  }

  // Only allow users with role 'user' who have a cleanerId
  if (!user || userRole !== 'user' || !cleanerId) {
    console.log('CleanerDashboard - Redirecting to auth. User:', !!user, 'Role:', userRole, 'CleanerId:', cleanerId);
    return <Navigate to="/auth" replace />;
  }

  // Get first name for greeting
  const firstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Cleaner';

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <CleanerSidebar />
        <SidebarInset>
          <header className="flex h-12 sm:h-16 shrink-0 items-center gap-2 border-b px-3 sm:px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1" />
            <div className="text-sm sm:text-lg font-semibold">
              Hello {firstName}! 👋
            </div>
          </header>
          
          <main className="flex-1 space-y-3 sm:space-y-4 p-3 sm:p-6 lg:p-8 pt-3 sm:pt-6">
            <CleanerUpcomingBookings />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default CleanerDashboard;

