import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { UnifiedHeader } from '@/components/UnifiedHeader';
import { adminNavigation } from '@/lib/navigationItems';
import NewBookingForm from '@/components/booking/NewBookingForm';
import BulkAirbnbBookingDialog from '@/components/booking/BulkAirbnbBookingDialog';
import { EndOfTenancyBookingForm } from '@/components/booking/EndOfTenancyBookingForm';
import { Button } from '@/components/ui/button';
import { Home, Building } from 'lucide-react';

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
            title=""
            user={user}
            userRole={userRole}
            onSignOut={handleSignOut}
          />
          
          <main className="flex-1 p-4 space-y-4 max-w-full overflow-x-hidden">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Create New Booking</h2>
                <div className="flex gap-3">
                  <EndOfTenancyBookingForm
                    onSubmit={(bookingData) => {
                      console.log('End of Tenancy booking:', bookingData);
                      // Handle the booking submission here
                    }}
                  >
                    <Button className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
                      <Building className="h-4 w-4" />
                      End of Tenancy Booking
                    </Button>
                  </EndOfTenancyBookingForm>
                  <Button
                    onClick={() => setShowBulkAirbnb(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    <Home className="h-4 w-4" />
                    Bulk Create Airbnb Bookings
                  </Button>
                </div>
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