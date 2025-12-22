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

const CleanerTodayPage = () => {
  const { user, userRole, cleanerId, loading } = useAuth();
  const { data: todayCount, isLoading: countLoading } = useTodayBookingsCount();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // Determine mobile view BEFORE any conditional returns
  const isMobileView = isCapacitor() || isMobile;

  console.log('CleanerTodayPage state', { userRole, cleanerId, loading, todayCount, countLoading });

  // Initialize offline-first photo system
  usePhotoSync();

  // Show loading only for auth, not for count (count can load in background)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-base">Loading today's work...</div>
      </div>
    );
  }

  // Allow 'user' role with cleanerId or admin
  if (!user || (userRole !== 'user' && userRole !== 'admin') || (userRole === 'user' && !cleanerId)) {
    return <Navigate to="/auth" replace />;
  }

  const firstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Cleaner';

  return (
    <div className="min-h-screen bg-background">
      <CleanerTopNav />
      
      <main className="pt-header-safe pb-20 content-bottom-spacer">
        {/* Header - hidden in mobile view */}
        {!isMobileView && (
          <div className="px-4 py-4 border-b border-border">
            <h1 className="text-2xl font-bold text-foreground">Today's Work</h1>
            <p className="text-sm text-muted-foreground">Hello, {firstName}</p>
          </div>
        )}

        {/* Content */}
        <div className="p-4 pt-2">
          {countLoading ? (
            <div className="flex justify-center py-8">
              <div className="text-muted-foreground">Loading bookings...</div>
            </div>
          ) : todayCount === 0 ? (
            <Navigate to="/cleaner-upcoming-bookings" replace />
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
