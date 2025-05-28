
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import UsersSection from './UsersSection';
import CustomersSection from './CustomersSection';

const UserManagementTabs = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshUsers = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>User & Customer Management</CardTitle>
          <Button
            onClick={refreshUsers}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 relative z-10"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Users
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
          </TabsList>
          
          <TabsContent value="users">
            <UsersSection refreshKey={refreshKey} />
          </TabsContent>
          
          <TabsContent value="customers">
            <CustomersSection />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default UserManagementTabs;
