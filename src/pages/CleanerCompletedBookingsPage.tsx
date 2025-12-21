import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import CleanerPastBookings from '@/components/cleaner/CleanerPastBookings';
import CleanerBottomNav from '@/components/cleaner/CleanerBottomNav';
import CleanerTopNav from '@/components/cleaner/CleanerTopNav';

const CleanerCompletedBookingsPage = () => {
  const { user, userRole, cleanerId, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-base">Loading bookings...</div>
      </div>
    );
  }

  if (!user || (userRole !== 'user' && userRole !== 'admin') || (userRole === 'user' && !cleanerId)) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <CleanerTopNav />
      
      <main className="pt-header-safe pb-20 content-bottom-spacer">
        <div className="p-4">
          <CleanerPastBookings />
        </div>
      </main>

      <CleanerBottomNav />
    </div>
  );
};

export default CleanerCompletedBookingsPage;
