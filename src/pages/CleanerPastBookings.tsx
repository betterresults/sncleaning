
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { CleanerSidebar } from '@/components/CleanerSidebar';
import CleanerPastBookings from '@/components/cleaner/CleanerPastBookings';
import AdminCleanerSelector from '@/components/admin/AdminCleanerSelector';
import { AdminCleanerProvider } from '@/contexts/AdminCleanerContext';

const CleanerPastBookingsPage = () => {
  const { user, userRole, cleanerId, loading } = useAuth();
  
  // Check if admin is viewing this dashboard
  const isAdminViewing = userRole === 'admin';

  console.log('CleanerPastBookings - Auth state:', { user: !!user, userRole, cleanerId, loading });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading past bookings...</div>
      </div>
    );
  }

  if (!user || (userRole !== 'user' && userRole !== 'admin') || (userRole === 'user' && !cleanerId)) {
    console.log('CleanerPastBookings - Redirecting to auth. User:', !!user, 'Role:', userRole, 'CleanerId:', cleanerId);
    return <Navigate to="/auth" replace />;
  }

  // Get first name for greeting
  const firstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Cleaner';

  return (
    <AdminCleanerProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gray-50">
          <CleanerSidebar />
          <SidebarInset className="flex-1 min-w-0">
            <header className="sticky top-0 z-10 flex h-16 sm:h-14 shrink-0 items-center gap-3 border-b bg-white px-3 sm:px-4 shadow-sm">
              <SidebarTrigger className="h-10 w-10 sm:h-8 sm:w-8 p-2 touch-manipulation" />
              <div className="flex-1 min-w-0" />
              <div className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                Hello {firstName}! 👋
              </div>
            </header>
            
            <main className="flex-1 p-2 sm:p-4 space-y-2 sm:space-y-4 w-full overflow-x-hidden">
              <div className="w-full max-w-full">
                {isAdminViewing && <AdminCleanerSelector />}
                <CleanerPastBookings />
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </AdminCleanerProvider>
  );
};

export default CleanerPastBookingsPage;

