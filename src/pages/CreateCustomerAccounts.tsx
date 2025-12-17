import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { UnifiedHeader } from '@/components/UnifiedHeader';
import { adminNavigation } from '@/lib/navigationItems';
import CreateCleanerUsersUtility from '@/components/admin/CreateCleanerUsersUtility';
import { BulkCreateAccountsDialog } from '@/components/admin/BulkCreateAccountsDialog';

const CreateCustomerAccounts = () => {
  const { user, userRole, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!user || (userRole !== 'admin' && userRole !== 'sales_agent')) {
    return <Navigate to="/auth" replace />;
  }

  const isSalesAgent = userRole === 'sales_agent';

  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col w-full bg-gray-50">
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
            onSignOut={handleSignOut}
          />
          <SidebarInset className="flex-1">
            <main className="flex-1 p-4 space-y-4 max-w-full overflow-x-hidden">
              <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-semibold">Customer Account Management</h1>
                  {!isSalesAgent && <BulkCreateAccountsDialog />}
                </div>
                <CreateCleanerUsersUtility readOnly={isSalesAgent} />
              </div>
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default CreateCustomerAccounts;