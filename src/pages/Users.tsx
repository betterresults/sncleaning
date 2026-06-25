import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ModernUsersTable from '@/components/ModernUsersTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, UserCheck, UserPlus } from 'lucide-react';

const Users = () => {
  const { user, userRole, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('customers');

  return (
<div className="max-w-7xl mx-auto">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-6">
                      <TabsTrigger value="customers" className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4" />
                        <span className="hidden sm:inline">Customers</span>
                      </TabsTrigger>
                      <TabsTrigger value="cleaners" className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4" />
                        <span className="hidden sm:inline">Cleaners</span>
                      </TabsTrigger>
                      <TabsTrigger value="office" className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Office Staff</span>
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="customers">
                      <ModernUsersTable userType="customer" />
                    </TabsContent>
                    
                    <TabsContent value="cleaners">
                      <ModernUsersTable userType="cleaner" />
                    </TabsContent>
                    
                    <TabsContent value="office">
                      <ModernUsersTable userType="office" />
                    </TabsContent>
                  </Tabs>
                </div>
  );
};

export default Users;