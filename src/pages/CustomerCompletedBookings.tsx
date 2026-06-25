import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomerLinenAccess } from '@/hooks/useCustomerLinenAccess';
import CustomerPastBookings from '@/components/customer/CustomerPastBookings';
import AdminCustomerSelector from '@/components/admin/AdminCustomerSelector';

const CustomerCompletedBookings = () => {
  const { user, userRole, customerId, cleanerId, loading, signOut } = useAuth();
  const { hasLinenAccess } = useCustomerLinenAccess();

  // Show loading state while auth is loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center py-8 text-muted-foreground">
          Loading...
        </div>
      </div>
    );
  }

  // Only redirect if not authenticated at all

  // For customers, we don't need to check customerId here since the component will handle it
  // For non-admins who aren't customers, redirect to appropriate dashboard

  return (
<div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-6">
                {userRole === 'admin' && <AdminCustomerSelector />}
                <CustomerPastBookings />
              </div>
  );
};

export default CustomerCompletedBookings;