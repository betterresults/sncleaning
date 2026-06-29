import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ModernUsersTable from '@/components/ModernUsersTable';
import { ShellLoading, ShellPage } from '@/layouts/shell';

const UsersAdmins = () => {
  const { user, userRole, signOut } = useAuth();

  return (
    <ShellPage width="wide">
                  <ModernUsersTable userType="admin" />
                </ShellPage>
  );
};

export default UsersAdmins;