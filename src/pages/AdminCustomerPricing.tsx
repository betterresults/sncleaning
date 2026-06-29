import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CustomerPricingOverrides } from '@/components/admin/CustomerPricingOverrides';
import { ShellLoading, ShellPage } from '@/layouts/shell';

const AdminCustomerPricing = () => {
  const { user, userRole, customerId, cleanerId, loading, signOut } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <ShellPage width="wide">
                <CustomerPricingOverrides />
              </ShellPage>
  );
};

export default AdminCustomerPricing;
