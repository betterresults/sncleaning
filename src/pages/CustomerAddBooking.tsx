
import React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import CustomerSidebar from '@/components/CustomerSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AdminCustomerSelector from '@/components/admin/AdminCustomerSelector';

const CustomerAddBooking = () => {
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
              <h1 className="text-3xl font-bold">Add New Booking</h1>
              <p className="text-muted-foreground">Schedule a new cleaning service</p>
            </div>

            {/* Service Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Card className="cursor-pointer hover:bg-accent/50 transition-colors border-2 hover:border-primary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Airbnb Cleaning
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Professional cleaning for short-term rentals</p>
                  <p className="text-sm mt-2 font-medium">Standard • Mid-stay • Deep cleaning</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:bg-accent/50 transition-colors border-2 hover:border-primary opacity-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Standard Cleaning
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Regular house cleaning service</p>
                  <p className="text-sm mt-2 text-muted-foreground">Coming Soon</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:bg-accent/50 transition-colors border-2 hover:border-primary opacity-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Deep Cleaning
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Thorough deep cleaning service</p>
                  <p className="text-sm mt-2 text-muted-foreground">Coming Soon</p>
                </CardContent>
              </Card>
            </div>

            {/* Airbnb Booking Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Airbnb Cleaning Booking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Plus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Airbnb Booking Form</h3>
                  <p>Dynamic booking form with pricing calculator will be implemented here.</p>
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
