import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import EnhancedCleanerManagement from '@/components/EnhancedCleanerManagement';
import { ShellLoading, ShellPage } from '@/layouts/shell';

const UsersCleaners = () => {
  const { user, userRole, signOut } = useAuth();

  // Allow admin and sales_agent

  return (
    <ShellPage width="wide">
                <EnhancedCleanerManagement />
              </ShellPage>
  );
};

export default UsersCleaners;