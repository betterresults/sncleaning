import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { UnifiedHeader } from '@/components/UnifiedHeader';
import { adminNavigation } from '@/lib/navigationItems';
import { PastBookingsSimpleView } from '@/components/bookings/PastBookingsSimpleView';
import { PastBookingsStats } from '@/components/bookings/PastBookingsStats';
import { supabase } from '@/integrations/supabase/client';
import { subMonths } from 'date-fns';

const PastBookings = () => {
  const { user, userRole, signOut } = useAuth();
  const [timeRangeFilter, setTimeRangeFilter] = useState("last-month");
  
  // Stats state
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    unpaidCount: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [timeRangeFilter]);

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      
      // Calculate date range
      let startDate: Date;
      const endDate = new Date();
      
      switch(timeRangeFilter) {
        case 'last-month':
          startDate = subMonths(endDate, 1);
          break;
        case 'last-3-months':
          startDate = subMonths(endDate, 3);
          break;
        case 'last-6-months':
          startDate = subMonths(endDate, 6);
          break;
        case 'all-time':
        default:
          startDate = new Date('2020-01-01');
          break;
      }

      const { data, error } = await supabase
        .from('past_bookings')
        .select('total_cost, payment_status')
        .gte('date_time', startDate.toISOString())
        .lte('date_time', endDate.toISOString());

      if (error) throw error;

      const totalBookings = data?.length || 0;
      const totalRevenue = data?.reduce((sum, booking) => {
        const cost = typeof booking.total_cost === 'string' 
          ? parseFloat(booking.total_cost) 
          : booking.total_cost;
        return sum + (cost || 0);
      }, 0) || 0;
      const unpaidCount = data?.filter(b => 
        b.payment_status?.toLowerCase() === 'unpaid'
      ).length || 0;

      setStats({ totalBookings, totalRevenue, unpaidCount });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!user || userRole !== 'admin') {
    return <Navigate to="/auth" replace />;
  }

  return (
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
            onSignOut={handleSignOut}
          />
          <SidebarInset className="flex-1">
            <main className="flex-1 p-2 sm:p-4 lg:p-6 space-y-2 sm:space-y-4 max-w-full overflow-x-hidden">
              <div className="max-w-7xl mx-auto space-y-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                    Past Bookings
                  </h1>
                  <p className="text-muted-foreground">
                    View and manage completed bookings
                  </p>
                </div>

                <PastBookingsStats
                  totalBookings={stats.totalBookings}
                  totalRevenue={stats.totalRevenue}
                  unpaidCount={stats.unpaidCount}
                  loading={statsLoading}
                />

                <PastBookingsSimpleView 
                  onTimeRangeChange={setTimeRangeFilter}
                  timeRangeFilter={timeRangeFilter}
                />
              </div>
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default PastBookings;
