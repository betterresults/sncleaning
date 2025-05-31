
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import DashboardStats from '@/components/admin/DashboardStats';
import BookingsTable from '@/components/admin/BookingsTable';

const AdminDashboard = () => {
  const { user, userRole, loading } = useAuth();

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

  // Extract first name from email (before @)
  const firstName = user.email?.split('@')[0] || 'Admin';

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 to-blue-50">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-12 sm:h-16 shrink-0 items-center gap-2 border-b bg-white/80 backdrop-blur-sm px-3 sm:px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1" />
            <div className="text-xs sm:text-sm text-gray-600 font-medium">
              Hello, {firstName}
            </div>
          </header>
          
          <main className="flex-1 space-y-6 p-3 sm:p-6 lg:p-8">
            <div className="space-y-6 sm:space-y-8">
              <DashboardStats />
              
              <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                <CardHeader className="pb-3 sm:pb-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
                  <CardTitle className="text-lg sm:text-xl font-bold">Bookings Management</CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  <BookingsTable />
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
