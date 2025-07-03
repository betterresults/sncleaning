
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import DashboardStats from '@/components/admin/DashboardStats';
import UpcomingBookings from '@/components/dashboard/UpcomingBookings';

const AdminDashboard = () => {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user || userRole !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // Extract first name from email (before @)
  const firstName = user.email?.split('@')[0] || 'Admin';

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-white/80 backdrop-blur-lg px-6 shadow-sm">
            <SidebarTrigger className="-ml-1 hover:bg-blue-50 rounded-lg p-2 transition-colors" />
            <div className="flex-1" />
            <div className="text-sm text-gray-700 font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Welcome back, {firstName}
            </div>
          </header>
          
          <main className="flex-1 space-y-8 p-6 lg:p-8">
            <div className="space-y-8">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-gray-600">Overview of your cleaning business</p>
              </div>
              
              <DashboardStats />
              
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 text-white">
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    📋 Bookings Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
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

export default AdminDashboard;
