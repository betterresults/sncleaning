import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import CleanerPaymentsManager from '@/components/payments/CleanerPaymentsManager';

const AdminCleanerPayments = () => {
  const { user, userRole, customerId, cleanerId, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-base">Loading...</div>
      </div>
    );
  }

  return (
<div className="max-w-7xl mx-auto">
                <CleanerPaymentsManager />
              </div>
  );
};

export default AdminCleanerPayments;