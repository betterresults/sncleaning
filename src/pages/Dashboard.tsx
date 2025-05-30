
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import UpcomingBookings from '@/components/dashboard/UpcomingBookings';
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

  const timeRangeButtons = [
    { key: 'today', label: 'Today', icon: Clock },
    { key: '3days', label: 'Next 3 Days', icon: Calendar },
    { key: '7days', label: 'Next 7 Days', icon: CalendarDays },
    { key: '30days', label: 'Next 30 Days', icon: CalendarClock },
  ] as const;

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
            <div className="max-w-full">
              {/* Time Range Filter Buttons */}
              <div className="mb-4 sm:mb-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                  {timeRangeButtons.map(({ key, label, icon: Icon }) => (
                    <Button
                      key={key}
                      variant={selectedTimeRange === key ? "default" : "outline"}
                      onClick={() => setSelectedTimeRange(key)}
                      className="flex items-center gap-1 sm:gap-2 h-10 sm:h-12 text-xs sm:text-sm"
                    >
                      <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">{label}</span>
                      <span className="sm:hidden">
                        {key === 'today' ? 'Today' : 
                         key === '3days' ? '3D' : 
                         key === '7days' ? '7D' : '30D'}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>

              <Card className="mb-4 sm:mb-6">
                <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
                  <CardTitle className="text-lg sm:text-xl lg:text-2xl">Upcoming Bookings</CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                  <UpcomingBookings selectedTimeRange={selectedTimeRange} />
                </CardContent>
              </Card>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
