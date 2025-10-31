import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { UnifiedHeader } from '@/components/UnifiedHeader';
import { getCustomerNavigation } from '@/lib/navigationItems';
import { useCustomerLinenAccess } from '@/hooks/useCustomerLinenAccess';
import CustomerPastBookings from '@/components/customer/CustomerPastBookings';
import AdminCustomerSelector from '@/components/admin/AdminCustomerSelector';

const CustomerCompletedBookings = () => {
  const { user, userRole, customerId, cleanerId, loading, signOut } = useAuth();
  const { hasLinenAccess } = useCustomerLinenAccess();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

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
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // For customers, we don't need to check customerId here since the component will handle it
  // For non-admins who aren't customers, redirect to appropriate dashboard
  if (userRole === 'user') {
    return <Navigate to="/cleaner-dashboard" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <UnifiedSidebar
          navigationItems={getCustomerNavigation(hasLinenAccess)}
          user={user}
          userRole={userRole}
          customerId={customerId}
          cleanerId={cleanerId}
          onSignOut={handleSignOut}
        />
        <SidebarInset className="flex-1 flex flex-col w-full">
          <UnifiedHeader 
            title="Completed Bookings 📋"
            user={user}
            userRole={userRole}
            showBackToAdmin={userRole === 'admin'}
          />
          
          <main className="flex-1 p-2 sm:p-4 lg:p-6 w-full overflow-x-hidden">
            <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-6">
              {userRole === 'admin' && <AdminCustomerSelector />}
              <CustomerPastBookings />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default CustomerCompletedBookings;