import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import QuoteLeadsView from '@/components/admin/QuoteLeadsView';
import { usePageTracking } from '@/hooks/usePageTracking';
import { ShellLoading, ShellPage } from '@/layouts/shell';

const AdminQuoteLeads = () => {
  usePageTracking('Admin Quote Leads');
  const { user, userRole, customerId, cleanerId, assignedSources, loading, signOut } = useAuth();

  if (loading) {
    return <ShellLoading />;
  }

  // Allow admin and sales_agent

  return (
    <ShellPage width="wide">
                <QuoteLeadsView 
                  agentUserId={user?.id} 
                  isAgent={userRole === 'sales_agent'}
                  agentAssignedSources={assignedSources}
                />
              </ShellPage>
  );
};

export default AdminQuoteLeads;
