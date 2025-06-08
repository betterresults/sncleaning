
import React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import CustomerAccountCreator from '@/components/CustomerAccountCreator';

const CreateCustomerAccounts = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold">Create Customer Accounts</h1>
              <p className="text-muted-foreground">Create system user accounts for existing customers</p>
            </div>
            <CustomerAccountCreator />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default CreateCustomerAccounts;
