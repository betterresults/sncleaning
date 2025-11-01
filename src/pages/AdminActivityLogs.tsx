import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { UnifiedHeader } from '@/components/UnifiedHeader';
import { adminNavigation } from '@/lib/navigationItems';
import ActivityLogsView from '@/components/admin/ActivityLogsView';
import { usePageTracking } from '@/hooks/usePageTracking';

const AdminActivityLogs = () => {
  usePageTracking('Admin Activity Logs');
  const { user, userRole, customerId, cleanerId, loading, signOut } = useAuth();

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
        <div className="text-base">Loading activity logs...</div>
      </div>
    );
  }

  // Only allow admins
  if (!user || userRole !== 'admin') {
    return <Navigate to="/auth" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <UnifiedSidebar 
          navigationItems={adminNavigation}
          user={user}
          userRole={userRole}
          customerId={customerId}
          cleanerId={cleanerId}
          onSignOut={handleSignOut}
        />
        <SidebarInset className="flex-1">
          <UnifiedHeader 
            title=""
            user={user}
            userRole={userRole}
            onSignOut={handleSignOut}
          />
          
          <main className="flex-1 p-2 sm:p-4 space-y-3 sm:space-y-4 w-full overflow-x-hidden">
            <div className="w-full px-1 sm:px-0 max-w-7xl mx-auto">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-[#185166]">Activity Logs</h1>
                <p className="text-gray-600 mt-2">
                  Monitor all user activities and system events
                </p>
              </div>
              <ActivityLogsView />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AdminActivityLogs;