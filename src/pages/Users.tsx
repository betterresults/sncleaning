
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
        <SidebarInset className="flex-1 flex flex-col min-w-0">
          
          {/* Mobile-First Header */}
          <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-white px-4 shadow-sm">
            <SidebarTrigger className="lg:hidden" />
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-gray-900 truncate">
                User Management
              </h1>
            </div>
            
            {/* Create Buttons - Fixed Positioning */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreateUserForm(!showCreateUserForm)}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                type="button"
              >
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {showCreateUserForm ? 'Cancel' : 'User'}
                </span>
                <span className="sm:hidden">+</span>
              </button>
              
              <button
                onClick={() => setShowCreateCustomerForm(!showCreateCustomerForm)}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
                type="button"
              >
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {showCreateCustomerForm ? 'Cancel' : 'Customer'}
                </span>
                <span className="sm:hidden">+</span>
              </button>
            </div>
          </header>
          
          {/* Mobile-First Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="p-4 space-y-6 max-w-full">
              
              {/* Create User Form */}
              {showCreateUserForm && (
                <div className="space-y-3">
                  <h2 className="text-base font-semibold text-gray-900">
                    Create New User
                  </h2>
                  <div className="bg-white border rounded-lg p-4">
                    <CreateUserForm onSuccess={handleCreateUserSuccess} />
                  </div>
                </div>
              )}
              
              {/* Create Customer Form */}
              {showCreateCustomerForm && (
                <div className="space-y-3">
                  <h2 className="text-base font-semibold text-gray-900">
                    Create New Customer
                  </h2>
                  <div className="bg-gray-50 border rounded-lg p-4">
                    <p className="text-sm text-gray-600">
                      Customer creation form will be handled in the tabs below.
                    </p>
                  </div>
                </div>
              )}
              
              {/* User Management Tabs */}
              <UserManagementTabs 
                refreshKey={refreshKey}
                showCreateUserForm={showCreateUserForm}
                showCreateCustomerForm={showCreateCustomerForm}
                onCreateUserSuccess={handleCreateUserSuccess}
                onCreateCustomerSuccess={handleCreateCustomerSuccess}
              />
              
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Users;
