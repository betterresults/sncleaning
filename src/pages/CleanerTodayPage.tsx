import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import CleanerTodayBookingsList from '@/components/cleaner/CleanerTodayBookingsList';
import CleanerBottomNav from '@/components/cleaner/CleanerBottomNav';
import { isCapacitor } from '@/utils/capacitor';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { useAdminCleaner } from '@/contexts/AdminCleanerContext';

const CleanerTodayPage = () => {
  const { user, userRole, cleanerId, loading } = useAuth();
  const { selectedCleanerId } = useAdminCleaner();
  const navigate = useNavigate();
  const [checkingBookings, setCheckingBookings] = useState(true);

  const effectiveCleanerId = userRole === 'admin' ? selectedCleanerId : cleanerId;

  useEffect(() => {
    const checkTodayBookings = async () => {
      if (!effectiveCleanerId || loading) return;

      try {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);

        const { count, error } = await supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('cleaner', effectiveCleanerId)
          .gte('date_time', startOfDay.toISOString())
          .lte('date_time', endOfDay.toISOString());

        if (!error && count !== null) {
          if (count === 0) {
            navigate('/cleaner-dashboard', { replace: true });
          }
        }
      } catch (error) {
        console.error('Error checking today bookings:', error);
      } finally {
        setCheckingBookings(false);
      }
    };

    checkTodayBookings();
  }, [effectiveCleanerId, loading, navigate]);

  if (loading || checkingBookings) {
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
    <div className="min-h-screen bg-background content-bottom-spacer">
      {/* Header - hidden in mobile view */}
      {!isMobileView && (
        <div className="sticky top-0 z-40 bg-background border-b border-border">
          <div className="px-4 py-4">
            <h1 className="text-2xl font-bold text-foreground">Today's Work</h1>
            <p className="text-sm text-muted-foreground">Hello, {firstName}</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <CleanerTodayBookingsList />
      </div>

      <CleanerBottomNav />
    </div>
  );
};

export default CleanerTodayPage;
