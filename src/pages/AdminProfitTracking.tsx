import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProfitTrackingDashboard } from '@/components/payments/ProfitTrackingDashboard';
import { ShellLoading, ShellPage } from '@/layouts/shell';

const AdminProfitTracking = () => {
  const { user, userRole, customerId, cleanerId, loading, signOut } = useAuth();

  if (loading) {
    return <ShellLoading />;
  }

  return (
    <ShellPage width="wide">
                <ProfitTrackingDashboard />
              </ShellPage>
  );
};

export default AdminProfitTracking;