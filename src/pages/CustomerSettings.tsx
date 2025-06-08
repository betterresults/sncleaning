
import React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import CustomerSidebar from '@/components/CustomerSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, User, MapPin, CreditCard } from 'lucide-react';

const CustomerSettings = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <CustomerSidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-muted-foreground">Manage your account settings and preferences</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Personal information settings</p>
                    <p className="text-sm">Edit your name, email, and phone number</p>
                  </div>
                </CardContent>
              </Card>

              {/* Addresses */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Addresses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Manage your addresses</p>
                    <p className="text-sm">Add, edit, or remove service addresses</p>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Details */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Payment methods and billing</p>
                    <p className="text-sm">Add, edit, or remove payment methods</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default CustomerSettings;
