import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import CompanySettingsManager from '@/components/admin/CompanySettingsManager';
import { ShellLoading, ShellPage } from '@/layouts/shell';

const AdminCompanySettings = () => {
  const { user, userRole, customerId, cleanerId, signOut } = useAuth();

  return (
    <ShellPage width="wide">
                <CompanySettingsManager />
              </ShellPage>
  );
};

export default AdminCompanySettings;
