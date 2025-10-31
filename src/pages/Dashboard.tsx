import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { UnifiedHeader } from '@/components/UnifiedHeader';
import { adminNavigation } from '@/lib/navigationItems';
import UpcomingBookings from '@/components/dashboard/UpcomingBookings';
import DashboardStats from '@/components/admin/DashboardStats';
import StorageTestDialog from '@/components/debug/StorageTestDialog';
import { Calendar, TestTube } from 'lucide-react';
import AdminGuard from '@/components/AdminGuard';

const Dashboard = () => {
  const { user, userRole, cleanerId, loading, signOut } = useAuth();
  const [showStorageTest, setShowStorageTest] = useState(false);

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
        <div className="min-h-screen flex w-full bg-gray-50">
          <UnifiedSidebar 
            navigationItems={adminNavigation}
            user={user}
            userRole={userRole}
            onSignOut={handleSignOut}
          />
          <SidebarInset className="flex-1">
            <UnifiedHeader 
              title="Admin Dashboard 📊"
              user={user}
              userRole={userRole}
              onSignOut={handleSignOut}
            />
            
            <main className="flex-1 p-2 sm:p-4 md:p-6 space-y-4 sm:space-y-6 max-w-full overflow-x-hidden">
              <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
                {/* Test Button */}
                <div className="flex justify-end">
                  <Button 
                    onClick={() => setShowStorageTest(true)}
                    variant="outline"
                    className="flex items-center justify-center gap-2 text-sm"
                  >
                    <TestTube className="h-4 w-4" />
                    <span>Test Photo Storage</span>
                  </Button>
                </div>

                {/* Statistics - Last 30 Days */}
                <DashboardStats />
                
                {/* Today's Schedule */}
                <Card className="border shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl font-semibold flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Today's Schedule
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2 sm:p-4 pt-0">
                    <UpcomingBookings 
                      dashboardDateFilter={todayRange}
                    />
                  </CardContent>
                </Card>
              </div>
            </main>
          </SidebarInset>
        </div>
        
        {/* Storage Test Dialog */}
        <StorageTestDialog 
          open={showStorageTest} 
          onOpenChange={setShowStorageTest} 
        />
      </SidebarProvider>
    </AdminGuard>
  );
};

export default Dashboard;