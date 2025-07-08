import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { UnifiedHeader } from '@/components/UnifiedHeader';
import { adminNavigation } from '@/lib/navigationItems';
import UpcomingBookings from '@/components/dashboard/UpcomingBookings';
import DashboardStats from '@/components/admin/DashboardStats';
import { Calendar, Clock, CalendarDays, CalendarClock } from 'lucide-react';

const Dashboard = () => {
  const { user, userRole, cleanerId, loading, signOut } = useAuth();
  const [selectedTimeRange, setSelectedTimeRange] = useState<'today' | '3days' | '7days' | '30days'>('3days');

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  console.log('Dashboard - Auth state:', { user: !!user, userRole, cleanerId, loading });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect cleaners to their dashboard
  if (userRole === 'user' && cleanerId) {
    console.log('Dashboard - Redirecting cleaner to cleaner dashboard');
    return <Navigate to="/cleaner-dashboard" replace />;
  }

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
          dateTo: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString()
        };
    }
  };

  const dateRange = getDateRange();

  return (
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
          />
          
          <main className="flex-1 p-4 space-y-4 max-w-full overflow-x-hidden">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Time Range Selector */}
              <div className="space-y-3">
                <h2 className="text-base font-semibold text-gray-900">
                  Filter by Time Period
                </h2>
                
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'today' as const, label: 'Today', icon: '📅', shortLabel: 'Today' },
                    { key: '3days' as const, label: '3 Days', icon: '📊', shortLabel: '3D' },
                    { key: '7days' as const, label: '7 Days', icon: '📈', shortLabel: '7D' },
                    { key: '30days' as const, label: '30 Days', icon: '📋', shortLabel: '30D' }
                  ].map((range) => (
                    <Button
                      key={range.key}
                      variant={selectedTimeRange === range.key ? "default" : "outline"}
                      onClick={() => setSelectedTimeRange(range.key)}
                      className={`
                        h-12 w-full text-sm font-medium transition-all
                        ${selectedTimeRange === range.key 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }
                      `}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{range.icon}</span>
                        <span className="hidden sm:inline">{range.label}</span>
                        <span className="sm:hidden">{range.shortLabel}</span>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Statistics Section */}
              <div className="space-y-3">
                <h2 className="text-base font-semibold text-gray-900">
                  Statistics
                </h2>
                <DashboardStats filters={dateRange} />
              </div>
              
              {/* Bookings Section */}
              <div className="space-y-3">
                <h2 className="text-base font-semibold text-gray-900">
                  Bookings Management
                </h2>
                
                <Card className="border shadow-sm">
                  <CardContent className="p-4">
                    <UpcomingBookings 
                      dashboardDateFilter={dateRange}
                    />
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

export default Dashboard;