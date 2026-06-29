import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DomesticConfigPanel } from '@/components/domestic/DomesticConfigPanel';
import { ShellLoading, ShellPage } from '@/layouts/shell';

const AdminDomesticFormSettings = () => {
  const { user, userRole, customerId, cleanerId, loading, signOut } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <ShellPage width="narrow">
                <DomesticConfigPanel />
              </ShellPage>
  );
};

export default AdminDomesticFormSettings;