import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { UnifiedHeader } from '@/components/UnifiedHeader';
import { adminNavigation } from '@/lib/navigationItems';
import DashboardStats from '@/components/admin/DashboardStats';
import { TestEmailButton } from '@/components/TestEmailButton';

const AdminDashboard = () => {
  const { user, userRole, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!user || userRole !== 'admin') {
    return <Navigate to="/auth" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <UnifiedSidebar 
          navigationItems={adminNavigation}
          user={user}
          onSignOut={handleSignOut}
        />
        <SidebarInset className="flex-1">
          <UnifiedHeader 
            title="Admin Overview 📊"
            user={user}
            userRole={userRole}
          />
          
          <main className="flex-1 p-4 space-y-4 max-w-full overflow-x-hidden">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Dashboard Overview</h2>
                <div className="text-xs text-muted-foreground">
                  <TestEmailButton />
                </div>
              </div>
              <DashboardStats />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;