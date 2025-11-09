import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import CleanerUpcomingBookings from '@/components/cleaner/CleanerUpcomingBookings';
import CleanerPastBookings from '@/components/cleaner/CleanerPastBookings';
import CleanerBottomNav from '@/components/cleaner/CleanerBottomNav';
import { useAvailableBookingsCount } from '@/hooks/useAvailableBookingsCount';
import { isCapacitor } from '@/utils/capacitor';

const CleanerBookingsPage = () => {
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
    <div className="min-h-screen bg-background content-bottom-spacer">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-foreground">My Bookings</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
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
          </TabsContent>

          <TabsContent value="completed">
            <CleanerPastBookings />
          </TabsContent>
        </Tabs>
      </div>

      <CleanerBottomNav />
    </div>
  );
};

export default CleanerBookingsPage;
