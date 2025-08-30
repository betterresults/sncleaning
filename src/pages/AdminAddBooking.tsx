import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { UnifiedHeader } from '@/components/UnifiedHeader';
import { adminNavigation } from '@/lib/navigationItems';
import NewBookingForm from '@/components/booking/NewBookingForm';
import BulkAirbnbBookingDialog from '@/components/booking/BulkAirbnbBookingDialog';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

const AdminAddBooking = () => {
  const { user, userRole, customerId, cleanerId, signOut } = useAuth();
  const [showBulkAirbnb, setShowBulkAirbnb] = React.useState(false);

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
      <div className="min-h-screen flex w-full bg-gray-50">
        <UnifiedSidebar 
          navigationItems={adminNavigation} 
          user={user}
          userRole={userRole}
          customerId={customerId}
          cleanerId={cleanerId}
          onSignOut={handleSignOut}
        />
        <SidebarInset className="flex-1">
          <UnifiedHeader 
            title="Add New Booking 📅"
            user={user}
            userRole={userRole}
            onSignOut={handleSignOut}
          />
          
          <main className="flex-1 p-4 space-y-4 max-w-full overflow-x-hidden">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex justify-end mb-4">
                <Button
                  onClick={() => setShowBulkAirbnb(true)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <Home className="h-4 w-4" />
                  Bulk Create Airbnb Bookings
                </Button>
              </div>
              
              <NewBookingForm onBookingCreated={() => {}} />
              
              <BulkAirbnbBookingDialog
                open={showBulkAirbnb}
                onOpenChange={setShowBulkAirbnb}
                onBookingsCreated={() => {
                  setShowBulkAirbnb(false);
                  // Optionally redirect or show success message
                }}
              />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AdminAddBooking;