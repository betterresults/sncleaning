import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import PaymentManagementDashboard from '@/components/payments/PaymentManagementDashboard';
import { ShellLoading, ShellPage } from '@/layouts/shell';

const AdminPaymentManagement = () => {
  const { user, userRole, customerId, cleanerId, loading, signOut } = useAuth();

  if (loading) {
    return <ShellLoading />;
  }

  return (
    <ShellPage width="wide">
                <PaymentManagementDashboard />
              </ShellPage>
  );
};

export default AdminPaymentManagement;