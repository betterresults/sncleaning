import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AirbnbConfigPanel } from '@/components/airbnb/AirbnbConfigPanel';
import { ShellLoading, ShellPage } from '@/layouts/shell';

const AdminAirbnbFormSettings = () => {
  const { user, userRole, customerId, cleanerId, loading, signOut } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <ShellPage width="narrow">
                <AirbnbConfigPanel />
              </ShellPage>
  );
};

export default AdminAirbnbFormSettings;
