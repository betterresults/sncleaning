import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { UnifiedHeader } from '@/components/UnifiedHeader';
import { adminNavigation } from '@/lib/navigationItems';
import DashboardStats from '@/components/admin/DashboardStats';
import TodayBookingsCards from '@/components/dashboard/TodayBookingsCards';
import RecentActivity from '@/components/dashboard/RecentActivity';
import QuickStats from '@/components/dashboard/QuickStats';
import { Calendar, Plus } from 'lucide-react';
import AdminGuard from '@/components/AdminGuard';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, userRole, cleanerId, loading, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  console.log('Dashboard - Auth state:', { user: !!user, userRole, cleanerId, loading });

  // Calculate date range for today's bookings
  const getTodayRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return {
      dateFrom: today.toISOString(),
      dateTo: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString()
    };
  };

  // Calculate date range for next 7 days (excluding today)
  const getNext7DaysRange = () => {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const next7Days = new Date(tomorrow.getTime() + 7 * 24 * 60 * 60 * 1000);
    return {
      dateFrom: tomorrow.toISOString(),
      dateTo: next7Days.toISOString()
    };
  };

  const todayRange = getTodayRange();
  const next7DaysRange = getNext7DaysRange();

  // This dashboard is ADMIN-ONLY - wrap everything in AdminGuard
  return (
    <AdminGuard>
      <SidebarProvider>
        <div className="min-h-screen flex flex-col w-full bg-gray-50">
          <UnifiedHeader 
            title=""
            user={user}
            userRole={userRole}
            onSignOut={handleSignOut}
          />
          <div className="flex flex-1 w-full">
            <UnifiedSidebar 
              navigationItems={adminNavigation}
              user={user}
              userRole={userRole}
              onSignOut={handleSignOut}
            />
            <SidebarInset className="flex-1 flex flex-col p-0 m-0">
              <main className="flex-1 bg-gray-50 m-0 px-4 md:px-6 py-4 md:py-6 space-y-6 max-w-[1600px]">
                {/* Statistics - Last 30 Days */}
                <DashboardStats />
                
                {/* Today's Bookings */}
                <Card className="border shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle className="text-xl font-semibold flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Today's Bookings
                    </CardTitle>
                    <Button 
                      onClick={() => navigate('/bookings')}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      New Booking
                    </Button>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <TodayBookingsCards 
                      dashboardDateFilter={todayRange}
                    />
                  </CardContent>
                </Card>

                {/* Next 7 Days Bookings */}
                <Card className="border shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl font-semibold flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Next 7 Days
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <TodayBookingsCards 
                      dashboardDateFilter={next7DaysRange}
                    />
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <QuickStats />

                {/* Recent Activity */}
                <Card className="border shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl font-semibold">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <RecentActivity />
                  </CardContent>
                </Card>
              </main>
            </SidebarInset>
          </div>
        </div>
      </SidebarProvider>
    </AdminGuard>
  );
};

export default Dashboard;
