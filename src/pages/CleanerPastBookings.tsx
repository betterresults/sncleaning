
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { CleanerSidebar } from '@/components/CleanerSidebar';
import CleanerPastBookings from '@/components/cleaner/CleanerPastBookings';

const CleanerPastBookingsPage = () => {
  const { user, userRole, cleanerId, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user || userRole !== 'user' || !cleanerId) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <CleanerSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1" />
            <div className="text-sm text-gray-600">
              Welcome, {user.email}
            </div>
          </header>
          
          <main className="flex-1 space-y-4 p-8 pt-6">
            <CleanerPastBookings />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default CleanerPastBookingsPage;
