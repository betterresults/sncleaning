import React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import CustomerPortalView from '@/components/admin/CustomerPortalView';

const AdminCustomerPortalView = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold">Customer Portal Preview</h1>
              <p className="text-muted-foreground">
                View the customer experience from their perspective
              </p>
            </div>
            <CustomerPortalView />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AdminCustomerPortalView;