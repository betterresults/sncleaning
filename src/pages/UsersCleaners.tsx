import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import EnhancedCleanerManagement from '@/components/EnhancedCleanerManagement';

const UsersCleaners = () => {
  const { user, userRole, signOut } = useAuth();

  // Allow admin and sales_agent

  return (
<div className="max-w-7xl mx-auto">
                <EnhancedCleanerManagement />
              </div>
  );
};

export default UsersCleaners;