import React, { useState } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { UnifiedHeader } from '@/components/UnifiedHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getCustomerNavigation } from '@/lib/navigationItems';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomerLinenAccess } from '@/hooks/useCustomerLinenAccess';
import LinenInventoryView from '@/components/customer/LinenInventoryView';
import LinenOrdersView from '@/components/customer/LinenOrdersView';

const CustomerLinenManagement = () => {
  const { user, userRole, signOut } = useAuth();
  const { hasLinenAccess } = useCustomerLinenAccess();
  const [activeTab, setActiveTab] = useState('inventory');

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
          navigationItems={getCustomerNavigation(hasLinenAccess)}
          user={user}
          userRole={userRole}
          onSignOut={handleSignOut}
        />
        <SidebarInset className="flex-1 flex flex-col w-full">
          <UnifiedHeader 
            title="Linen Management 🏷️"
            user={user}
            userRole={userRole}
          />
          
          <main className="flex-1 p-2 sm:p-4 lg:p-6 w-full overflow-x-hidden">
            <div className="w-full max-w-7xl mx-auto">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="inventory">Inventory</TabsTrigger>
                  <TabsTrigger value="orders">Orders</TabsTrigger>
                </TabsList>
                
                <TabsContent value="inventory" className="mt-0">
                  <LinenInventoryView />
                </TabsContent>
                
                <TabsContent value="orders" className="mt-0">
                  <LinenOrdersView />
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default CustomerLinenManagement;