import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import QuoteLeadsView from '@/components/admin/QuoteLeadsView';
import { usePageTracking } from '@/hooks/usePageTracking';

const AdminQuoteLeads = () => {
  usePageTracking('Admin Quote Leads');
  const { user, userRole, customerId, cleanerId, assignedSources, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-base">Loading quote leads...</div>
      </div>
    );
  }

  // Allow admin and sales_agent

  return (
<div className="w-full max-w-7xl mx-auto">
                <QuoteLeadsView 
                  agentUserId={user?.id} 
                  isAgent={userRole === 'sales_agent'}
                  agentAssignedSources={assignedSources}
                />
              </div>
  );
};

export default AdminQuoteLeads;
