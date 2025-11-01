import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { UnifiedHeader } from '@/components/UnifiedHeader';
import { adminNavigation } from '@/lib/navigationItems';
import NewBookingForm from '@/components/booking/NewBookingForm';
import ServiceSelection from '@/components/booking/ServiceSelection';
import BulkAirbnbBookingDialog from '@/components/booking/BulkAirbnbBookingDialog';
import { EndOfTenancyBookingForm } from '@/components/booking/EndOfTenancyBookingForm';
import { Button } from '@/components/ui/button';
import { Home, Building, ArrowLeft } from 'lucide-react';

const AdminAddBooking = () => {
  const { user, userRole, customerId, cleanerId, signOut } = useAuth();
  const navigate = useNavigate();
  const [showBulkAirbnb, setShowBulkAirbnb] = React.useState(false);
  const [selectedService, setSelectedService] = React.useState<string | null>(null);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleServiceSelect = (serviceType: string) => {
    if (serviceType === 'airbnb-cleaning') {
      // Navigate to dedicated admin Airbnb booking page
      navigate('/admin/airbnb');
    } else {
      // For all other services, show the form inline
      setSelectedService(serviceType);
    }
  };

  const handleBackToServices = () => {
    setSelectedService(null);
  };

  const handleBookingCreated = () => {
    // Reset to service selection after booking is created
    setSelectedService(null);
  };

  if (!user || userRole !== 'admin') {
    return <Navigate to="/auth" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col w-full bg-gray-50">
        <UnifiedHeader 
          title=""
          user={user}
          userRole={userRole}
          onSignOut={handleSignOut}
        />
        <div className="flex flex-1 w-full">
          <UnifiedSidebar 
            navigationItems={adminNavigation} 
            user={user}
            userRole={userRole}
            customerId={customerId}
            cleanerId={cleanerId}
            onSignOut={handleSignOut}
          />
          <SidebarInset className="flex-1">
            <main className="flex-1 p-4 space-y-4 max-w-full overflow-x-hidden">
              <div className="max-w-4xl mx-auto space-y-6">
                {selectedService ? (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <Button
                        variant="outline"
                        onClick={handleBackToServices}
                        className="flex items-center gap-2"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Services
                      </Button>
                      <div className="flex gap-3">
                        <EndOfTenancyBookingForm
                          onSubmit={(bookingData) => {
                            console.log('End of Tenancy booking:', bookingData);
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
                    
                    <div className="bg-white rounded-lg shadow p-6">
                      <NewBookingForm onBookingCreated={handleBookingCreated} />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex justify-end gap-3">
                      <EndOfTenancyBookingForm
                        onSubmit={(bookingData) => {
                          console.log('End of Tenancy booking:', bookingData);
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
                    
                    <div className="bg-white rounded-lg shadow p-6">
                      <ServiceSelection onServiceSelect={handleServiceSelect} isAdminView={true} />
                    </div>
                  </div>
                )}
                
                <BulkAirbnbBookingDialog
                  open={showBulkAirbnb}
                  onOpenChange={setShowBulkAirbnb}
                  onBookingsCreated={() => {
                    setShowBulkAirbnb(false);
                  }}
                />
              </div>
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminAddBooking;