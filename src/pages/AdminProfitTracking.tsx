import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { UnifiedHeader } from '@/components/UnifiedHeader';
import { adminNavigation } from '@/lib/navigationItems';
import { ProfitTrackingDashboard } from '@/components/payments/ProfitTrackingDashboard';

const AdminProfitTracking = () => {
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
        <div className="text-base">Loading...</div>
      </div>
    );
  }

  if (!user || userRole !== 'admin') {
    return <Navigate to="/auth" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col w-full bg-background">
        <UnifiedHeader 
          title=""
          user={user}
          userRole={userRole}
          onSignOut={handleSignOut}
        />
        <div className="flex flex-1 w-full">
          <UnifiedSidebar 
            navigationItems={adminNavigation}
            user={user}
            userRole={userRole}
            customerId={customerId}
            cleanerId={cleanerId}
            onSignOut={handleSignOut}
          />
          <SidebarInset className="flex-1">
            <main className="flex-1 p-4 space-y-4 max-w-full overflow-x-hidden">
              <div className="max-w-7xl mx-auto">
                <ProfitTrackingDashboard />
              </div>
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminProfitTracking;