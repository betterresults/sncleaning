import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomerLinenAccess } from '@/hooks/useCustomerLinenAccess';
import CustomerPastBookings from '@/components/customer/CustomerPastBookings';
import AdminCustomerSelector from '@/components/admin/AdminCustomerSelector';
import { ShellLoading, ShellPage } from '@/layouts/shell';

const CustomerCompletedBookings = () => {
  const { user, userRole, customerId, cleanerId, loading, signOut } = useAuth();
  const { hasLinenAccess } = useCustomerLinenAccess();

  // Show loading state while auth is loading
  if (loading) {
    return <ShellLoading />;
  }

  // Only redirect if not authenticated at all

  // For customers, we don't need to check customerId here since the component will handle it
  // For non-admins who aren't customers, redirect to appropriate dashboard

  return (
    <ShellPage width="wide">
                {userRole === 'admin' && <AdminCustomerSelector />}
                <CustomerPastBookings />
              </ShellPage>
  );
};

export default CustomerCompletedBookings;