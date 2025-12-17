
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import UsersSection from './UsersSection';
import CleanersSection from './CleanersSection';
import CustomersSection from './CustomersSection';

interface UserManagementTabsProps {
  refreshKey?: number;
  showCreateUserForm?: boolean;
  showCreateCleanerForm?: boolean;
  showCreateCustomerForm?: boolean;
  onCreateUserSuccess?: () => void;
  onCreateCleanerSuccess?: () => void;
  onCreateCustomerSuccess?: () => void;
  readOnly?: boolean;
}

const UserManagementTabs = ({ 
  refreshKey, 
  showCreateUserForm, 
  showCreateCleanerForm,
  showCreateCustomerForm, 
  onCreateUserSuccess, 
  onCreateCleanerSuccess,
  onCreateCustomerSuccess,
  readOnly = false
}: UserManagementTabsProps) => {
  const refreshUsers = () => {
    window.location.reload();
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <CardTitle className="text-lg sm:text-xl">User Management</CardTitle>
          <Button
            onClick={refreshUsers}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 self-start sm:self-auto"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh Users</span>
            <span className="sm:hidden">Refresh</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-3 sm:px-6">
        <Tabs defaultValue="users" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="users" className="text-sm">Users</TabsTrigger>
            <TabsTrigger value="cleaners" className="text-sm">Cleaners</TabsTrigger>
            <TabsTrigger value="customers" className="text-sm">Customers</TabsTrigger>
          </TabsList>
          
          <TabsContent value="users">
            <UsersSection 
              refreshKey={refreshKey} 
              hideCreateButton={true}
            />
          </TabsContent>
          
          <TabsContent value="cleaners">
            <CleanersSection 
              hideCreateButton={true}
              showCreateForm={showCreateCleanerForm}
              onCreateSuccess={onCreateCleanerSuccess}
              readOnly={readOnly}
            />
          </TabsContent>
          
          <TabsContent value="customers">
            <CustomersSection 
              hideCreateButton={true}
              showCreateForm={showCreateCustomerForm}
              onCreateSuccess={onCreateCustomerSuccess}
              readOnly={readOnly}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default UserManagementTabs;
