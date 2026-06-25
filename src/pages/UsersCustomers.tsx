import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ModernUsersTable from '@/components/ModernUsersTable';
import { ShellLoading, ShellPage } from '@/layouts/shell';

const UsersCustomers = () => {
  const { user, userRole, signOut } = useAuth();

  // Allow admin and sales_agent

  return (
    <ShellPage width="wide">
                <ModernUsersTable userType="customer" />
              </ShellPage>
  );
};

export default UsersCustomers;