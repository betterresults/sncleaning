
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, userRole, signOut, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const getUserDisplayName = () => {
    const firstName = user.user_metadata?.first_name;
    const lastName = user.user_metadata?.last_name;
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    
    return user.email || 'User';
  };

  const getRoleDisplayName = (role: string | null) => {
    if (!role) return 'Customer';
    
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">SN Cleaning</h1>
            <Button onClick={handleSignOut} variant="outline">
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-gray-900">
                Welcome, {getUserDisplayName()}!
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="p-6 bg-blue-50 rounded-lg">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  Your Role
                </h2>
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 font-medium">
                  {getRoleDisplayName(userRole)}
                </div>
              </div>
              
              <div className="space-y-4">
                <p className="text-gray-600">
                  You are logged in as a <strong>{getRoleDisplayName(userRole)}</strong>.
                </p>
                
                {userRole === 'admin' && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800">
                      As an admin, you have full access to manage the system.
                    </p>
                  </div>
                )}
                
                {userRole === 'cleaner' && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800">
                      As a cleaner, you can manage your bookings and schedule.
                    </p>
                  </div>
                )}
                
                {userRole === 'customer' && (
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="text-purple-800">
                      As a customer, you can book cleaning services and manage your appointments.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
