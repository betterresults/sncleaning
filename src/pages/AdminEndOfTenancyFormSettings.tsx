import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { EndOfTenancyConfigPanel } from '@/components/end-of-tenancy/EndOfTenancyConfigPanel';
import { ShellLoading, ShellPage } from '@/layouts/shell';

const AdminEndOfTenancyFormSettings = () => {
  const { user, userRole, customerId, cleanerId, loading, signOut } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <ShellPage width="narrow">
                <EndOfTenancyConfigPanel />
              </ShellPage>
  );
};

export default AdminEndOfTenancyFormSettings;
