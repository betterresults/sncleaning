import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { UnifiedHeader } from '@/components/UnifiedHeader';
import { adminNavigation } from '@/lib/navigationItems';
import ModernUsersTable from '@/components/ModernUsersTable';
import AdminGuard from '@/components/AdminGuard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, UserCheck, UserPlus } from 'lucide-react';

const Users = () => {
  const { user, userRole, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('customers');

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AdminGuard>
      <SidebarProvider>
        <div className="min-h-screen flex flex-col w-full bg-gray-50">
          <UnifiedHeader 
            title=""
            user={user}
            userRole={userRole}
            onSignOut={handleSignOut}
          />
          <div className="flex flex-1 w-full">
            <UnifiedSidebar 
              navigationItems={adminNavigation}
              user={user}
              onSignOut={handleSignOut}
            />
            <SidebarInset className="flex-1">
              <main className="flex-1 p-4 space-y-4 max-w-full overflow-x-hidden">
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
              </main>
            </SidebarInset>
          </div>
        </div>
      </SidebarProvider>
    </AdminGuard>
  );
};

export default Users;