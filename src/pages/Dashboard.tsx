
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
        <SidebarInset className="flex-1">
          <header className="flex h-12 sm:h-16 shrink-0 items-center gap-2 border-b px-3 sm:px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1" />
            <div className="text-xs sm:text-sm text-gray-600">
              Hello, {firstName}
            </div>
          </header>
          
          <main className="flex-1 p-3 sm:p-4 lg:p-6 xl:p-8">
            <div className="max-w-full space-y-6">
              {/* Time Range Buttons - Mobile Responsive */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3">
                {[
                  { key: 'today' as const, label: 'Today', icon: '📅' },
                  { key: '3days' as const, label: '3 Days', icon: '📊' },
                  { key: '7days' as const, label: '7 Days', icon: '📈' },
                  { key: '30days' as const, label: '30 Days', icon: '📋' }
                ].map((range) => (
                  <Button
                    key={range.key}
                    variant={selectedTimeRange === range.key ? "default" : "outline"}
                    onClick={() => setSelectedTimeRange(range.key)}
                    className={`
                      w-full transition-all duration-200 font-medium py-2 px-2 text-xs sm:text-sm sm:py-3 sm:px-4
                      ${selectedTimeRange === range.key 
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                        : 'bg-white hover:bg-blue-50 text-gray-700 border-gray-200 hover:border-blue-300'
                      }
                    `}
                  >
                    <span className="mr-1 sm:mr-2">{range.icon}</span>
                    <span className="hidden sm:inline">{range.label}</span>
                    <span className="sm:hidden">{range.label.split(' ')[0]}</span>
                  </Button>
                ))}
              </div>

              {/* Main Statistics - filtered by time range */}
              <DashboardStats filters={dateRange} />
              
              {/* Bookings List - with time range filter */}
              <UpcomingBookings 
                dashboardDateFilter={dateRange}
              />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
