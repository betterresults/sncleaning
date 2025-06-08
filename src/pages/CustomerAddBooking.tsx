
import React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import CustomerSidebar from '@/components/CustomerSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';

const CustomerAddBooking = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <CustomerSidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold">Add New Booking</h1>
              <p className="text-muted-foreground">Schedule a new cleaning service</p>
            </div>

            {/* Placeholder content - will be implemented later */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Book a Cleaning Service
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Plus className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Booking Form Coming Soon</h3>
                  <p>The booking form will be implemented here.</p>
                  <p className="text-sm">You'll be able to select services, schedule appointments, and manage your bookings.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default CustomerAddBooking;
