import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { UnifiedHeader } from '@/components/UnifiedHeader';
import { adminNavigation } from '@/lib/navigationItems';
import UpcomingBookings from '@/components/dashboard/UpcomingBookings';
import DashboardStats from '@/components/admin/DashboardStats';
import { Calendar } from 'lucide-react';
import AdminGuard from '@/components/AdminGuard';

const Dashboard = () => {
  const { user, userRole, cleanerId, loading, signOut } = useAuth();
  const [selectedTimeRange, setSelectedTimeRange] = useState<'today' | '3days' | '7days' | '30days'>('30days');

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  console.log('Dashboard - Auth state:', { user: !!user, userRole, cleanerId, loading });

  // Calculate date range based on selected time range
  const getDateRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (selectedTimeRange) {
      case 'today':
        return {
          dateFrom: today.toISOString(),
          dateTo: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString()
        };
      case '3days':
        return {
          dateFrom: today.toISOString(),
          dateTo: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString()
        };
      case '7days':
        return {
          dateFrom: today.toISOString(),
          dateTo: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
        };
      case '30days':
        return {
          dateFrom: today.toISOString(),
          dateTo: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };
      default:
        return {
          dateFrom: today.toISOString(),
          dateTo: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };
    }
  };

  const dateRange = getDateRange();

  // This dashboard is ADMIN-ONLY - wrap everything in AdminGuard
  return (
    <AdminGuard>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gray-50">
          <UnifiedSidebar 
            navigationItems={adminNavigation}
            user={user}
            onSignOut={handleSignOut}
          />
          <SidebarInset className="flex-1">
            <UnifiedHeader 
              title="Admin Dashboard 📊"
              user={user}
              userRole={userRole}
              onSignOut={handleSignOut}
            />
            
            <main className="flex-1 p-4 space-y-6 max-w-full overflow-x-hidden">
              <div className="max-w-7xl mx-auto space-y-6">
                {/* Time Filter Dropdown */}
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-600" />
                  <Select value={selectedTimeRange} onValueChange={(value: 'today' | '3days' | '7days' | '30days') => setSelectedTimeRange(value)}>
                    <SelectTrigger className="w-48 bg-white border-gray-300 shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border shadow-lg z-50">
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="3days">Next 3 Days</SelectItem>
                      <SelectItem value="7days">Next 7 Days</SelectItem>
                      <SelectItem value="30days">Next 30 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Statistics */}
                <DashboardStats filters={dateRange} />
                
                {/* Bookings */}
                <Card className="border shadow-sm">
                  <CardContent className="p-4">
                    <UpcomingBookings 
                      dashboardDateFilter={dateRange}
                    />
                  </CardContent>
                </Card>
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </AdminGuard>
  );
};

export default Dashboard;