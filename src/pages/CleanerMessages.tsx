import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { UnifiedHeader } from '@/components/UnifiedHeader';
import { cleanerNavigation } from '@/lib/navigationItems';
import { useAdminCleaner } from '@/contexts/AdminCleanerContext';
import AdminCleanerSelector from '@/components/admin/AdminCleanerSelector';
import ChatInterface from '@/components/chat/ChatInterface';

const CleanerMessages = () => {
  const { user, userRole, cleanerId, loading, signOut } = useAuth();
  const { selectedCleanerId } = useAdminCleaner();

  // Use selected cleaner ID if admin is viewing, otherwise use authenticated cleaner's ID
  const effectiveCleanerId = userRole === 'admin' ? selectedCleanerId : cleanerId;

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
        <div className="text-base">Loading messages...</div>
      </div>
    );
  }

  // Allow users with role 'user' who have a cleanerId, or admins
  if (!user || (userRole !== 'user' && userRole !== 'admin') || (userRole === 'user' && !cleanerId)) {
    return <Navigate to="/auth" replace />;
  }

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
            title="Messages 💬"
            user={user}
            userRole={userRole}
          />
          
          <main className="flex-1 p-4 space-y-4 max-w-full overflow-x-hidden">
            <div className="max-w-7xl mx-auto">
              {userRole === 'admin' && <AdminCleanerSelector />}
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                Chat Interface for Cleaner #{effectiveCleanerId} (Props need to be updated)
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default CleanerMessages;