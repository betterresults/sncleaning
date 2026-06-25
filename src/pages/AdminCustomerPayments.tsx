import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import CustomerPaymentsManager from '@/components/payments/CustomerPaymentsManager';

const AdminCustomerPayments = () => {
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
                <CustomerPaymentsManager />
              </div>
  );
};

export default AdminCustomerPayments;