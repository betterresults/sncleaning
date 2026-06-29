import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CleanerChecklistsList } from '@/components/cleaner/CleanerChecklistsList';
import AdminCleanerSelector from '@/components/admin/AdminCleanerSelector';
import { ShellLoading, ShellPage } from '@/layouts/shell';

const CleanerChecklists = () => {
  const { user, userRole, cleanerId, loading, signOut } = useAuth();

  // Check if admin is viewing this dashboard

  const isAdminViewing = userRole === 'admin';

  if (loading) {
    return <ShellLoading />;
  }

  // Allow users with role 'user' who have a cleanerId, or admins

  return (
    <ShellPage width="wide">
                {isAdminViewing && <AdminCleanerSelector />}
                <CleanerChecklistsList />
              </ShellPage>
  );
};

export default CleanerChecklists;