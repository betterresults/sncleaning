import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ModernUsersTable from '@/components/ModernUsersTable';

const UsersCustomers = () => {
  const { user, userRole, signOut } = useAuth();

  // Allow admin and sales_agent

  return (
<div className="max-w-7xl mx-auto">
                <ModernUsersTable userType="customer" />
              </div>
  );
};

export default UsersCustomers;