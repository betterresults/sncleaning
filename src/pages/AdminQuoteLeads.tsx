import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { UnifiedHeader } from '@/components/UnifiedHeader';
import { adminNavigation, salesAgentNavigation } from '@/lib/navigationItems';
import QuoteLeadsView from '@/components/admin/QuoteLeadsView';
import { usePageTracking } from '@/hooks/usePageTracking';

const AdminQuoteLeads = () => {
  usePageTracking('Admin Quote Leads');
  const { user, userRole, customerId, cleanerId, assignedSources, loading, signOut } = useAuth();

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
        <div className="text-base">Loading quote leads...</div>
      </div>
    );
  }

  // Allow admin and sales_agent
  if (!user || (userRole !== 'admin' && userRole !== 'sales_agent')) {
    return <Navigate to="/auth" replace />;
  }

  const navigation = userRole === 'sales_agent' ? salesAgentNavigation : adminNavigation;

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
            navigationItems={navigation}
            user={user}
            userRole={userRole}
            customerId={customerId}
            cleanerId={cleanerId}
            onSignOut={handleSignOut}
          />
          <SidebarInset className="flex-1">
            <main className="flex-1 p-3 sm:p-6 w-full overflow-x-hidden">
              <div className="w-full max-w-7xl mx-auto">
                <QuoteLeadsView 
                  agentUserId={user?.id} 
                  isAgent={userRole === 'sales_agent'}
                  agentAssignedSources={assignedSources}
                />
              </div>
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminQuoteLeads;
