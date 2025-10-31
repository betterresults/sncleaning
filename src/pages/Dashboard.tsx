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

  const todayRange = getTodayRange();

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
              <main className="flex-1 bg-gray-50 m-0 pl-1 pr-4 md:pr-6 py-4 md:py-6 space-y-6" >
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

                {/* Statistics Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm text-gray-600">
                        <p>• Recent bookings and activity will appear here</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold">Monthly Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm text-gray-600">
                        <p>• Bookings and revenue charts will appear here</p>
                      </div>
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
