
import React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import CustomerSidebar from '@/components/CustomerSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AdminCustomerSelector from '@/components/admin/AdminCustomerSelector';

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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Bookings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No upcoming bookings found.</p>
                  <p className="text-sm">Book a new cleaning service to get started.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default CustomerDashboard;
