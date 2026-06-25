import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import CompanySettingsManager from '@/components/admin/CompanySettingsManager';

const AdminCompanySettings = () => {
  const { user, userRole, customerId, cleanerId, signOut } = useAuth();

  return (
<div className="max-w-7xl mx-auto">
                <CompanySettingsManager />
              </div>
  );
};

export default AdminCompanySettings;
