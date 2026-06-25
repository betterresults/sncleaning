import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import CoverageManagement from '@/components/admin/CoverageManagement';

const AdminCoverageManagement = () => {
  const { user, userRole, customerId, cleanerId, signOut } = useAuth();

  return (
<div className="max-w-7xl mx-auto">
                <CoverageManagement />
              </div>
  );
};

export default AdminCoverageManagement;
