
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigate, Link } from 'react-router-dom';
import DashboardStats from '@/components/admin/DashboardStats';
import UpcomingBookings from '@/components/dashboard/UpcomingBookings';

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
            <h1 className="text-xl font-semibold text-gray-900">MAIN DASHBOARD</h1>
            <div className="flex items-center space-x-4">
              {userRole === 'admin' && (
                <>
                  <Link to="/admin">
                    <Button variant="default">
                      Analytics & Bookings
                    </Button>
                  </Link>
                  <Link to="/users">
                    <Button variant="outline">
                      Manage Users
                    </Button>
                  </Link>
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

          {/* Statistics */}
          <DashboardStats />
          
          {/* Upcoming Bookings Table */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <UpcomingBookings />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
