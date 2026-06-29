import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import CustomerPaymentsManager from '@/components/payments/CustomerPaymentsManager';
import { ShellLoading, ShellPage } from '@/layouts/shell';

const AdminCustomerPayments = () => {
  const { user, userRole, customerId, cleanerId, loading, signOut } = useAuth();

  if (loading) {
    return <ShellLoading />;
  }

  return (
    <ShellPage width="wide">
                <CustomerPaymentsManager />
              </ShellPage>
  );
};

export default AdminCustomerPayments;