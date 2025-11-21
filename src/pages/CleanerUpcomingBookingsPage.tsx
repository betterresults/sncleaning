import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import CleanerUpcomingBookings from '@/components/cleaner/CleanerUpcomingBookings';
import CleanerBottomNav from '@/components/cleaner/CleanerBottomNav';
import CleanerTopNav from '@/components/cleaner/CleanerTopNav';
import { useAvailableBookingsCount } from '@/hooks/useAvailableBookingsCount';

const CleanerUpcomingBookingsPage = () => {
  const { user, userRole, cleanerId, loading } = useAuth();
  const navigate = useNavigate();
  const { data: availableCount } = useAvailableBookingsCount();

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

  const showAvailableBookings = availableCount && availableCount > 0;

  return (
    <div className="min-h-screen bg-background">
      <CleanerTopNav />
      
      <main className="pt-16 pb-20 content-bottom-spacer">
        <div className="p-4 space-y-4">
          {showAvailableBookings && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bell className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {availableCount} Available Booking{availableCount !== 1 ? 's' : ''}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Claim jobs now
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => navigate('/cleaner-available-bookings')}
                    size="sm"
                    className="ml-2"
                  >
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          <CleanerUpcomingBookings />
        </div>
      </main>

      <CleanerBottomNav />
    </div>
  );
};

export default CleanerUpcomingBookingsPage;
