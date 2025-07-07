
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
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset className="flex-1 flex flex-col min-w-0">
          {/* Mobile-First Header */}
          <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-white px-4 shadow-sm">
            <SidebarTrigger className="lg:hidden" />
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-gray-900 truncate">
                Admin Dashboard
              </h1>
            </div>
            <div className="text-sm text-gray-600 font-medium">
              {firstName}
            </div>
          </header>
          
          {/* Mobile-First Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="p-4 space-y-6 max-w-full">
              
              {/* Welcome Section - Mobile Optimized */}
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-gray-900">
                  Welcome back, {firstName}
                </h2>
                <p className="text-sm text-gray-600">
                  Manage your cleaning business
                </p>
              </div>
              
              {/* Stats Cards - Mobile First Grid */}
              <DashboardStats />
              
              {/* Bookings Section - Mobile Optimized */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  📋 Bookings Management
                </h3>
                
                <Card className="border shadow-sm">
                  <CardContent className="p-4">
                    <UpcomingBookings />
                  </CardContent>
                </Card>
              </div>
              
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;
