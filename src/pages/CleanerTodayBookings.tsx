import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { CleanerSidebar } from '@/components/CleanerSidebar';
import CleanerTodayBookingsList from '@/components/cleaner/CleanerTodayBookingsList';
import AdminCleanerSelector from '@/components/admin/AdminCleanerSelector';

const CleanerTodayBookings = () => {
  const { user, userRole, cleanerId, loading } = useAuth();
  
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

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <CleanerSidebar />
        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-white px-4 shadow-sm">
            <SidebarTrigger className="-ml-1 p-2" />
            <div className="flex-1" />
            <div className="text-base font-semibold text-gray-900 truncate">
              Today's Work 📍
            </div>
          </header>
          
          <main className="flex-1 p-4 space-y-4 max-w-full overflow-x-hidden">
            <div className="max-w-7xl mx-auto">
              {isAdminViewing && <AdminCleanerSelector />}
              <CleanerTodayBookingsList />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default CleanerTodayBookings;