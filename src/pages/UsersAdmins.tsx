import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ModernUsersTable from '@/components/ModernUsersTable';

const UsersAdmins = () => {
  const { user, userRole, signOut } = useAuth();

  return (
<div className="max-w-7xl mx-auto">
                  <ModernUsersTable userType="admin" />
                </div>
  );
};

export default UsersAdmins;