import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { UnifiedHeader } from '@/components/UnifiedHeader';
import { cleanerNavigation } from '@/lib/navigationItems';
import { CleanerChecklistsList } from '@/components/cleaner/CleanerChecklistsList';
import AdminCleanerSelector from '@/components/admin/AdminCleanerSelector';

const CleanerChecklists = () => {
  const { user, userRole, cleanerId, loading, signOut } = useAuth();

  // Check if admin is viewing this dashboard
  const isAdminViewing = userRole === 'admin';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-base">Loading checklists...</div>
      </div>
    );
  }

  // Allow users with role 'user' who have a cleanerId, or admins
  if (!user || (userRole !== 'user' && userRole !== 'admin') || (userRole === 'user' && !cleanerId)) {
    return <Navigate to="/auth" replace />;
  }

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <UnifiedSidebar 
          navigationItems={cleanerNavigation}
          user={user}
          onSignOut={handleSignOut}
        />
        <SidebarInset className="flex-1">
          <UnifiedHeader 
            title="Cleaning Checklists 📋"
            user={user}
            userRole={userRole}
          />
          
          <main className="flex-1 p-4 space-y-4 max-w-full overflow-x-hidden">
            <div className="max-w-7xl mx-auto">
              {isAdminViewing && <AdminCleanerSelector />}
              <CleanerChecklistsList />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default CleanerChecklists;