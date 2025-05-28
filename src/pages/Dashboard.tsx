
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import UpcomingBookings from '@/components/dashboard/UpcomingBookings';

const Dashboard = () => {
  const { user, userRole, cleanerId, loading } = useAuth();

  console.log('Dashboard - Auth state:', { user: !!user, userRole, cleanerId, loading });

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

  // Redirect cleaners to their dashboard
  if (userRole === 'user' && cleanerId) {
    console.log('Dashboard - Redirecting cleaner to cleaner dashboard');
    return <Navigate to="/cleaner-dashboard" replace />;
  }

  // Extract first name from email (before @)
  const firstName = user.email?.split('@')[0] || 'User';

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <header className="flex h-12 sm:h-16 shrink-0 items-center gap-2 border-b px-3 sm:px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1" />
            <div className="text-xs sm:text-sm text-gray-600">
              Hello, {firstName}
            </div>
          </header>
          
          <main className="flex-1 p-3 sm:p-4 lg:p-6 xl:p-8">
            <div className="max-w-full">
              <Card className="mb-4 sm:mb-6">
                <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
                  <CardTitle className="text-lg sm:text-xl lg:text-2xl">Upcoming Bookings</CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                  <UpcomingBookings />
                </CardContent>
              </Card>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
