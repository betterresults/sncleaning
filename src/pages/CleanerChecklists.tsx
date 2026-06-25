import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CleanerChecklistsList } from '@/components/cleaner/CleanerChecklistsList';
import AdminCleanerSelector from '@/components/admin/AdminCleanerSelector';

const CleanerChecklists = () => {
  const { user, userRole, cleanerId, loading, signOut } = useAuth();

  // Check if admin is viewing this dashboard

  const isAdminViewing = userRole === 'admin';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-base">Loading checklists...</div>
      </div>
    );
  }

  // Allow users with role 'user' who have a cleanerId, or admins

  return (
<div className="max-w-7xl mx-auto">
                {isAdminViewing && <AdminCleanerSelector />}
                <CleanerChecklistsList />
              </div>
  );
};

export default CleanerChecklists;