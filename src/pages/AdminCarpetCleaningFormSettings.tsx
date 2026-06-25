import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CarpetCleaningConfigPanel } from '@/components/carpet-cleaning/CarpetCleaningConfigPanel';
import { ShellLoading, ShellPage } from '@/layouts/shell';

const AdminCarpetCleaningFormSettings = () => {
  const { user, userRole, customerId, cleanerId, loading, signOut } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <ShellPage width="narrow">
                <CarpetCleaningConfigPanel />
              </ShellPage>
  );
};

export default AdminCarpetCleaningFormSettings;
