
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

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getUserDisplayName = () => {
    const firstName = user?.user_metadata?.first_name || '';
    const lastName = user?.user_metadata?.last_name || '';
    return `${firstName} ${lastName}`.trim() || user?.email || 'User';
  };

  const getRoleDisplayName = () => {
    switch (userRole) {
      case 'admin':
        return 'Administrator';
      case 'user':
        return 'Cleaner';
      case 'guest':
        return 'Customer';
      default:
        return 'User';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">SN Cleaning - Dashboard</h1>
            <div className="flex items-center space-x-4">
              {userRole === 'admin' && (
                <>
                  <Button onClick={() => window.location.href = '/admin'} variant="default">
                    Analytics & Bookings
                  </Button>
                  <Button onClick={() => window.location.href = '/users'} variant="outline">
                    Manage Users
                  </Button>
                </>
              )}
              <Button onClick={handleSignOut} variant="outline">
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome back, {getUserDisplayName()}!
            </h2>
            <p className="text-gray-600">
              You are logged in as: <span className="font-medium text-blue-600">{getRoleDisplayName()}</span>
            </p>
          </div>
          
          {/* Role-based content */}
          {userRole === 'admin' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button onClick={() => window.location.href = '/admin'} className="w-full">
                    View Analytics & Bookings
                  </Button>
                  <Button onClick={() => window.location.href = '/users'} variant="outline" className="w-full">
                    Manage Users
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>System Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Administrator Dashboard</p>
                  <p className="text-xs text-gray-500">Full system access</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">System activity and updates will appear here.</p>
                </CardContent>
              </Card>
            </div>
          )}
          
          {userRole === 'user' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Cleaner Dashboard</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Your cleaning schedule and bookings will appear here.</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Today's Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">No bookings scheduled for today.</p>
                </CardContent>
              </Card>
            </div>
          )}
          
          {userRole === 'guest' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Dashboard</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Your bookings and service history will appear here.</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Services</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">No upcoming services scheduled.</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
