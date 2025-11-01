import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { UnifiedHeader } from '@/components/UnifiedHeader';
import { adminNavigation } from '@/lib/navigationItems';
import { AirbnbConfigPanel } from '@/components/airbnb/AirbnbConfigPanel';

const AdminAirbnbFormSettings = () => {
  const { user, userRole, customerId, cleanerId, signOut } = useAuth();

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
          
          <main className="flex-1 p-4 space-y-4 max-w-full overflow-x-hidden">
            <AirbnbConfigPanel />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AdminAirbnbFormSettings;
