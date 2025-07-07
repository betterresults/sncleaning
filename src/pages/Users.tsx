
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import UserManagementTabs from '@/components/UserManagementTabs';
import { UserPlus } from 'lucide-react';
import CreateUserForm from '@/components/CreateUserForm';

const Users = () => {
  const { user, userRole, loading } = useAuth();
  const [showCreateUserForm, setShowCreateUserForm] = useState(false);
  const [showCreateCustomerForm, setShowCreateCustomerForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user || userRole !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const handleCreateUserSuccess = () => {
    setRefreshKey(prev => prev + 1);
    setShowCreateUserForm(false);
  };

  const handleCreateCustomerSuccess = () => {
    setRefreshKey(prev => prev + 1);
    setShowCreateCustomerForm(false);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-12 sm:h-16 shrink-0 items-center gap-2 border-b px-3 sm:px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1" />
            
            {/* Top Level Create Buttons - Mobile Responsive */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 z-50">
              <button
                onClick={() => setShowCreateUserForm(!showCreateUserForm)}
                className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 cursor-pointer bg-blue-900 hover:bg-blue-800 text-white shadow-lg hover:shadow-xl hover:scale-105"
                type="button"
              >
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">{showCreateUserForm ? 'Cancel User' : 'Create User'}</span>
                <span className="sm:hidden">{showCreateUserForm ? 'Cancel' : 'User'}</span>
              </button>
              
              <button
                onClick={() => setShowCreateCustomerForm(!showCreateCustomerForm)}
                className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 cursor-pointer bg-blue-900 hover:bg-blue-800 text-white shadow-lg hover:shadow-xl hover:scale-105"
                type="button"
              >
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">{showCreateCustomerForm ? 'Cancel Customer' : 'Create Customer'}</span>
                <span className="sm:hidden">{showCreateCustomerForm ? 'Cancel' : 'Customer'}</span>
              </button>
            </div>
          </header>
          
          <main className="flex-1 space-y-3 sm:space-y-4 p-3 sm:p-6 lg:p-8 pt-3 sm:pt-6">
            {/* Create Forms */}
            {showCreateUserForm && (
              <div className="mb-6">
                <CreateUserForm onSuccess={handleCreateUserSuccess} />
              </div>
            )}
            
            {showCreateCustomerForm && (
              <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                <h4 className="font-semibold mb-4">Create New Customer</h4>
                {/* Customer creation form will be handled by passing props to UserManagementTabs */}
              </div>
            )}
            
            <UserManagementTabs 
              refreshKey={refreshKey}
              showCreateUserForm={showCreateUserForm}
              showCreateCustomerForm={showCreateCustomerForm}
              onCreateUserSuccess={handleCreateUserSuccess}
              onCreateCustomerSuccess={handleCreateCustomerSuccess}
            />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Users;
