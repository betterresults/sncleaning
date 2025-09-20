import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useParams } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { UnifiedHeader } from '@/components/UnifiedHeader';
import { cleanerNavigation } from '@/lib/navigationItems';
import { CleaningChecklistInterface } from '@/components/cleaner/CleaningChecklistInterface';
import AdminCleanerSelector from '@/components/admin/AdminCleanerSelector';
import { useAdminCleaner } from '@/contexts/AdminCleanerContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { CheckSquare } from 'lucide-react';

const CleanerChecklist = () => {
  const { user, userRole, cleanerId, loading, signOut } = useAuth();
  const { bookingId } = useParams<{ bookingId: string }>();
  const { selectedCleanerId } = useAdminCleaner();
  const [bookingData, setBookingData] = useState<any>(null);
  const [bookingLoading, setBookingLoading] = useState(true);

  // Determine effective cleaner ID
  const effectiveCleanerId = userRole === 'admin' ? selectedCleanerId : cleanerId;
  const isAdminViewing = userRole === 'admin';

  useEffect(() => {
    const fetchBookingData = async () => {
      if (!bookingId) {
        setBookingLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            id,
            address,
            postcode,
            customer,
            date_time,
            service_type,
            property_details,
            cleaner,
            total_cost
          `)
          .eq('id', parseInt(bookingId))
          .single();

        if (error) throw error;
        setBookingData(data);
      } catch (error) {
        console.error('Error fetching booking data:', error);
      } finally {
        setBookingLoading(false);
      }
    };

    fetchBookingData();
  }, [bookingId]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading || bookingLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-base">Loading checklist...</div>
      </div>
    );
  }

  // Allow users with role 'user' who have a cleanerId, or admins
  if (!user || (userRole !== 'user' && userRole !== 'admin') || (userRole === 'user' && !cleanerId)) {
    return <Navigate to="/auth" replace />;
  }

  if (!bookingId || !bookingData) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gray-50">
          <UnifiedSidebar 
            navigationItems={cleanerNavigation}
            user={user}
            onSignOut={handleSignOut}
          />
          <SidebarInset className="flex-1">
            <UnifiedHeader 
              title="Cleaning Checklist"
              user={user}
              userRole={userRole}
            />
            
            <main className="flex-1 p-4 space-y-4 max-w-full overflow-x-hidden">
              <div className="max-w-7xl mx-auto">
                <Card>
                  <CardContent className="p-8 text-center">
                    <CheckSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2">No Booking Selected</h3>
                    <p className="text-muted-foreground">
                      Please select a booking to view its cleaning checklist.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  if (!effectiveCleanerId) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gray-50">
          <UnifiedSidebar 
            navigationItems={cleanerNavigation}
            user={user}
            onSignOut={handleSignOut}
          />
          <SidebarInset className="flex-1">
            <UnifiedHeader 
              title="Cleaning Checklist"
              user={user}
              userRole={userRole}
            />
            
            <main className="flex-1 p-4 space-y-4 max-w-full overflow-x-hidden">
              <div className="max-w-7xl mx-auto">
                {isAdminViewing && <AdminCleanerSelector />}
                <Card>
                  <CardContent className="p-8 text-center">
                    <CheckSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2">No Cleaner Selected</h3>
                    <p className="text-muted-foreground">
                      Please select a cleaner to view their checklists.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <UnifiedSidebar 
          navigationItems={cleanerNavigation}
          user={user}
          onSignOut={handleSignOut}
        />
        <SidebarInset className="flex-1">
          <UnifiedHeader 
            title="Cleaning Checklist 📋"
            user={user}
            userRole={userRole}
          />
          
          <main className="flex-1 p-4 space-y-4 max-w-full overflow-x-hidden">
            <div className="max-w-7xl mx-auto">
              {isAdminViewing && <AdminCleanerSelector />}
              <CleaningChecklistInterface
                bookingId={parseInt(bookingId)}
                cleanerId={effectiveCleanerId}
                bookingData={bookingData}
              />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default CleanerChecklist;