import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import CleanerTodayBookingsList from '@/components/cleaner/CleanerTodayBookingsList';
import CleanerBottomNav from '@/components/cleaner/CleanerBottomNav';
import { isCapacitor } from '@/utils/capacitor';

const CleanerTodayPage = () => {
  const { user, userRole, cleanerId, loading } = useAuth();

  if (loading) {
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

  return (
    <div className="min-h-screen bg-background content-bottom-spacer">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-foreground">Today's Work</h1>
          <p className="text-sm text-muted-foreground">Hello, {firstName}</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <CleanerTodayBookingsList />
      </div>

      <CleanerBottomNav />
    </div>
  );
};

export default CleanerTodayPage;
