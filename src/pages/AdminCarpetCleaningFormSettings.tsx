import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CarpetCleaningConfigPanel } from '@/components/carpet-cleaning/CarpetCleaningConfigPanel';

const AdminCarpetCleaningFormSettings = () => {
  const { user, userRole, customerId, cleanerId, loading, signOut } = useAuth();

  if (loading) {
    return null;
  }

  return (
<div className="max-w-4xl mx-auto">
                <CarpetCleaningConfigPanel />
              </div>
  );
};

export default AdminCarpetCleaningFormSettings;
