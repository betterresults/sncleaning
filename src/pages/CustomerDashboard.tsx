
import React from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { UnifiedHeader } from '@/components/UnifiedHeader';
import { customerNavigation } from '@/lib/navigationItems';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AdminCustomerSelector from '@/components/admin/AdminCustomerSelector';
import CustomerUpcomingBookings from '@/components/customer/CustomerUpcomingBookings';

const CustomerDashboard = () => {
  const { user, userRole, signOut } = useAuth();
  const isAdminViewing = userRole === 'admin';

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <UnifiedSidebar 
          navigationItems={customerNavigation}
          user={user}
          onSignOut={handleSignOut}
        />
        <SidebarInset className="flex-1">
          <UnifiedHeader 
            title="Customer Dashboard 🏠"
            user={user}
            userRole={userRole}
          />
          
          <main className="flex-1 p-2 sm:p-4 space-y-4 max-w-full overflow-x-hidden">
            <div className="max-w-7xl mx-auto px-2 sm:px-0">
              {isAdminViewing && <AdminCustomerSelector />}
              <CustomerUpcomingBookings />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default CustomerDashboard;
