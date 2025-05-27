
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigate } from 'react-router-dom';
import UserManagementTabs from '@/components/UserManagementTabs';

const Users = () => {
  const { user, userRole, signOut, loading } = useAuth();

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

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const refreshUsers = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">User Management</h1>
            <div className="flex items-center space-x-4">
              <Button onClick={() => window.location.href = '/dashboard'} variant="outline">
                Back to Dashboard
              </Button>
              <Button onClick={() => window.location.href = '/admin'} variant="outline">
                Analytics & Bookings
              </Button>
              <Button onClick={handleSignOut} variant="outline">
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <UserManagementTabs refreshUsers={refreshUsers} />
      </main>
    </div>
  );
};

export default Users;
