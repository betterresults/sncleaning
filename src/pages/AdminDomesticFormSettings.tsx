import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DomesticConfigPanel } from '@/components/domestic/DomesticConfigPanel';

const AdminDomesticFormSettings = () => {
  const { user, userRole, customerId, cleanerId, loading, signOut } = useAuth();

  if (loading) {
    return null;
  }

  return (
<div className="max-w-4xl mx-auto">
                <DomesticConfigPanel />
              </div>
  );
};

export default AdminDomesticFormSettings;