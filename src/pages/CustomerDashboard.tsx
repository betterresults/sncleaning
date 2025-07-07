
import React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import CustomerSidebar from '@/components/CustomerSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AdminCustomerSelector from '@/components/admin/AdminCustomerSelector';
import CustomerUpcomingBookings from '@/components/customer/CustomerUpcomingBookings';

const CustomerDashboard = () => {
  const { userRole } = useAuth();
  const isAdminViewing = userRole === 'admin';

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <CustomerSidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {isAdminViewing && <AdminCustomerSelector />}
            <div className="mb-6">
              <h1 className="text-3xl font-bold">My Bookings</h1>
              <p className="text-muted-foreground">View and manage your upcoming cleaning appointments</p>
            </div>

            {/* Placeholder content - will be implemented later */}
            <CustomerUpcomingBookings />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default CustomerDashboard;
