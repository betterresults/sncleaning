import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomerLinenAccess } from '@/hooks/useCustomerLinenAccess';
import LinenInventoryView from '@/components/customer/LinenInventoryView';
import LinenOrdersView from '@/components/customer/LinenOrdersView';

const CustomerLinenManagement = () => {
  const { user, userRole, customerId, cleanerId, signOut } = useAuth();
  const { hasLinenAccess } = useCustomerLinenAccess();
  const [activeTab, setActiveTab] = useState('inventory');

  return (
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
  );
};

export default CustomerLinenManagement;