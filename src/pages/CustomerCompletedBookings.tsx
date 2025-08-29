import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { UnifiedHeader } from '@/components/UnifiedHeader';
import { customerNavigation } from '@/lib/navigationItems';
import CustomerPastBookings from '@/components/customer/CustomerPastBookings';
import AdminCustomerSelector from '@/components/admin/AdminCustomerSelector';

const CustomerCompletedBookings = () => {
  const { user, userRole, customerId, loading, signOut } = useAuth();

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
          navigationItems={customerNavigation}
          user={user}
          onSignOut={handleSignOut}
        />
        <SidebarInset className="flex-1 flex flex-col w-full">
          <UnifiedHeader 
            title="Completed Bookings 📋"
            user={user}
            userRole={userRole}
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