import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import CleanerTodayBookingsList from '@/components/cleaner/CleanerTodayBookingsList';
import CleanerBottomNav from '@/components/cleaner/CleanerBottomNav';
import CleanerTopNav from '@/components/cleaner/CleanerTopNav';
import { isCapacitor } from '@/utils/capacitor';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAdminCleaner } from '@/contexts/AdminCleanerContext';
import { usePhotoSync } from '@/hooks/usePhotoSync';
import { useTodayBookingsCount } from '@/hooks/useTodayBookingsCount';
import { Calendar, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CleanerTodayPage = () => {
  const { user, userRole, cleanerId, loading } = useAuth();
  const { data: todayCount, isLoading: countLoading } = useTodayBookingsCount();
  const navigate = useNavigate();

  console.log('CleanerTodayPage state', { userRole, cleanerId, loading, todayCount, countLoading });

  // Initialize offline-first photo system
  usePhotoSync();

  if (loading || countLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-base">Loading today's work...</div>
      </div>
    );
  }

  if (!user || (userRole !== 'user' && userRole !== 'admin') || (userRole === 'user' && !cleanerId)) {
    return <Navigate to="/auth" replace />;
  }

  const firstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Cleaner';
  const isMobile = useIsMobile();
  const isMobileView = isCapacitor() || isMobile;

  return (
    <div className="min-h-screen bg-background">
      <CleanerTopNav />
      
      <main className="pt-16 pb-20 content-bottom-spacer">
        {/* Header - hidden in mobile view */}
        {!isMobileView && (
          <div className="px-4 py-4 border-b border-border">
            <h1 className="text-2xl font-bold text-foreground">Today's Work</h1>
            <p className="text-sm text-muted-foreground">Hello, {firstName}</p>
          </div>
        )}

        {/* Content */}
        <div className="p-4">
          {todayCount === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">No bookings today</h2>
              <p className="text-muted-foreground mb-6 text-center">
                Check available jobs or upcoming bookings
              </p>
              <div className="flex gap-3">
                <Button onClick={() => navigate('/cleaner-available-bookings')} variant="default">
                  <Briefcase className="h-4 w-4 mr-2" />
                  View Available Jobs
                </Button>
                <Button onClick={() => navigate('/cleaner-upcoming-bookings')} variant="outline">
                  View Upcoming
                </Button>
              </div>
            </div>
          ) : (
            <CleanerTodayBookingsList />
          )}
        </div>
      </main>

      <CleanerBottomNav />
    </div>
  );
};

export default CleanerTodayPage;
