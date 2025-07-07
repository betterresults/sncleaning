
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import UpcomingBookings from '@/components/dashboard/UpcomingBookings';
import DashboardStats from '@/components/admin/DashboardStats';
import { Calendar, Clock, CalendarDays, CalendarClock } from 'lucide-react';

const Dashboard = () => {
  const { user, userRole, cleanerId, loading } = useAuth();
  const [selectedTimeRange, setSelectedTimeRange] = useState<'today' | '3days' | '7days' | '30days'>('3days');

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

  // Extract first name from email (before @)
  const firstName = user.email?.split('@')[0] || 'User';

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
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset className="flex-1 flex flex-col min-w-0">
          
          {/* Mobile-First Header */}
          <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-white px-4 shadow-sm">
            <SidebarTrigger className="lg:hidden" />
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-gray-900 truncate">
                Dashboard
              </h1>
            </div>
            <div className="text-sm text-gray-600 font-medium">
              {firstName}
            </div>
          </header>
          
          {/* Mobile-First Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="p-4 space-y-6 max-w-full">
              
              {/* Time Range Selector - Mobile Optimized */}
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

              {/* Statistics Section - Mobile Optimized */}
              <div className="space-y-3">
                <h2 className="text-base font-semibold text-gray-900">
                  Statistics
                </h2>
                <DashboardStats filters={dateRange} />
              </div>
              
              {/* Bookings Section - Mobile Optimized */}
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
