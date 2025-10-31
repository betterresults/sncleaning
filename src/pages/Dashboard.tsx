import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { UnifiedHeader } from '@/components/UnifiedHeader';
import { adminNavigation } from '@/lib/navigationItems';
import DashboardStats from '@/components/admin/DashboardStats';
import TodaysSchedule from '@/components/dashboard/TodaysSchedule';
import UpcomingScheduleCalendar from '@/components/dashboard/UpcomingScheduleCalendar';
import StorageTestDialog from '@/components/debug/StorageTestDialog';
import { TestTube } from 'lucide-react';
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
          <SidebarInset className="flex-1 flex flex-col">
            <UnifiedHeader 
              title="Admin Dashboard 📊"
              user={user}
              userRole={userRole}
              onSignOut={handleSignOut}
            />
            
            <main className="flex-1 p-4 md:p-6 space-y-6 bg-gray-50">
              {/* Test Button */}
              <div className="flex justify-end">
                <Button 
                  onClick={() => setShowStorageTest(true)}
                  variant="outline"
                  className="flex items-center gap-2 text-sm"
                >
                  <TestTube className="h-4 w-4" />
                  Test Photo Storage
                </Button>
              </div>

              {/* Statistics - Last 30 Days */}
              <DashboardStats />
              
              {/* Upcoming Schedule Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <UpcomingScheduleCalendar />
                <TodaysSchedule />
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