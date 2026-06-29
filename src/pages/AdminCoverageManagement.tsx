import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import CoverageManagement from '@/components/admin/CoverageManagement';
import { ShellLoading, ShellPage } from '@/layouts/shell';

const AdminCoverageManagement = () => {
  const { user, userRole, customerId, cleanerId, signOut } = useAuth();

  return (
    <ShellPage width="wide">
                <CoverageManagement />
              </ShellPage>
  );
};

export default AdminCoverageManagement;
