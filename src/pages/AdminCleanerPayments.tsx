import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import CleanerPaymentsManager from '@/components/payments/CleanerPaymentsManager';
import { ShellLoading, ShellPage } from '@/layouts/shell';

const AdminCleanerPayments = () => {
  const { user, userRole, customerId, cleanerId, loading, signOut } = useAuth();

  if (loading) {
    return <ShellLoading />;
  }

  return (
    <ShellPage width="wide">
                <CleanerPaymentsManager />
              </ShellPage>
  );
};

export default AdminCleanerPayments;