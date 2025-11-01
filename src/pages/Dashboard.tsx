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
import PerformanceChart from '@/components/dashboard/PerformanceChart';
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
            <SidebarInset className="flex-1 flex flex-col p-0 m-0 overflow-x-hidden">
              <main className="flex-1 bg-gray-50 m-0 px-4 md:px-6 py-4 md:py-6 space-y-6 w-full">
                {/* Statistics - Last 30 Days */}
                <DashboardStats />
                
                {/* Today's Bookings */}
                <Card className="rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-0">
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle className="text-xl font-semibold flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Today's Bookings
                    </CardTitle>
                    <Button 
                      onClick={() => navigate('/bookings')}
                      className="flex items-center gap-2 rounded-full px-6 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 hover:from-gray-200 hover:to-gray-300 shadow-md hover:shadow-lg transition-all duration-200"
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
                <div>
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Bookings for Next 7 Days
                    </h2>
                  </div>
                  <TodayBookingsCards 
                    dashboardDateFilter={next7DaysRange}
                  />
                </div>

                {/* Activity and Stats Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Activity */}
                  <Card className="rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-0">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-xl font-semibold">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0">
                      <RecentActivity />
                    </CardContent>
                  </Card>

                  {/* Performance Stats */}
                  <Card className="rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-0">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-xl font-semibold">Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0">
                      <PerformanceChart />
                    </CardContent>
                  </Card>
                </div>
              </main>
            </SidebarInset>
          </div>
        </div>
      </SidebarProvider>
    </AdminGuard>
  );
};

export default Dashboard;
