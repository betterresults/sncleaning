import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CustomerPricingOverrides } from '@/components/admin/CustomerPricingOverrides';

const AdminCustomerPricing = () => {
  const { user, userRole, customerId, cleanerId, loading, signOut } = useAuth();

  if (loading) {
    return null;
  }

  return (
<div className="max-w-7xl mx-auto">
                <CustomerPricingOverrides />
              </div>
  );
};

export default AdminCustomerPricing;
