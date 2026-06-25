import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { EndOfTenancyConfigPanel } from '@/components/end-of-tenancy/EndOfTenancyConfigPanel';

const AdminEndOfTenancyFormSettings = () => {
  const { user, userRole, customerId, cleanerId, loading, signOut } = useAuth();

  if (loading) {
    return null;
  }

  return (
<div className="max-w-4xl mx-auto">
                <EndOfTenancyConfigPanel />
              </div>
  );
};

export default AdminEndOfTenancyFormSettings;
