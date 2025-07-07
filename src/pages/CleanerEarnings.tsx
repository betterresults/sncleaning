

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { CleanerSidebar } from '@/components/CleanerSidebar';
import CleanerEarnings from '@/components/cleaner/CleanerEarnings';
import AdminCleanerSelector from '@/components/admin/AdminCleanerSelector';
import { AdminCleanerProvider } from '@/contexts/AdminCleanerContext';

const CleanerEarningsPage = () => {
  const { user, userRole, cleanerId, loading } = useAuth();
  
  // Check if admin is viewing this dashboard
  const isAdminViewing = userRole === 'admin';

  console.log('CleanerEarnings - Auth state:', { user: !!user, userRole, cleanerId, loading });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading earnings...</div>
      </div>
    );
  }

  if (!user || (userRole !== 'user' && userRole !== 'admin') || (userRole === 'user' && !cleanerId)) {
    console.log('CleanerEarnings - Redirecting to auth. User:', !!user, 'Role:', userRole, 'CleanerId:', cleanerId);
    return <Navigate to="/auth" replace />;
  }

  // Get first name for greeting
  const firstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Cleaner';

  return (
    <AdminCleanerProvider>
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
              <div className="max-w-7xl mx-auto">
                {isAdminViewing && <AdminCleanerSelector />}
                <CleanerEarnings />
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </AdminCleanerProvider>
  );
};

export default CleanerEarningsPage;

