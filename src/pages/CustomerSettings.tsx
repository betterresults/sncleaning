
import React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import CustomerSidebar from '@/components/CustomerSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard } from 'lucide-react';
import PersonalInfoEditor from '@/components/customer/PersonalInfoEditor';
import AddressManager from '@/components/customer/AddressManager';
import PaymentMethodManager from '@/components/customer/PaymentMethodManager';
import { useAuth } from '@/contexts/AuthContext';
import AdminCustomerSelector from '@/components/admin/AdminCustomerSelector';

const CustomerSettings = () => {
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
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-muted-foreground">Manage your account settings and preferences</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {/* Personal Information */}
              <PersonalInfoEditor />

              {/* Addresses */}
              <AddressManager />

              {/* Payment Methods */}
              <PaymentMethodManager />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default CustomerSettings;
