import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import NewBookingForm from '@/components/booking/NewBookingForm';
import ServiceSelection from '@/components/booking/ServiceSelection';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const AdminAddBooking = () => {
  const { user, userRole, customerId, cleanerId, signOut } = useAuth();
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = React.useState<string | null>(null);

  const handleServiceSelect = (serviceType: string) => {
    if (serviceType === 'airbnb-cleaning') {
      // Navigate to dedicated admin Airbnb booking page
      navigate('/admin/airbnb');
    } else if (serviceType === 'domestic-cleaning') {
      // Navigate to dedicated admin Domestic booking page
      navigate('/admin/domestic');
    } else if (serviceType === 'linen-order') {
      // Navigate to linen order form
      navigate('/admin/linen');
    } else if (serviceType === 'carpet-cleaning') {
      // Navigate to dedicated admin Carpet booking page
      navigate('/admin/carpet');
    } else if (serviceType === 'end-of-tenancy') {
      // Navigate to dedicated admin End of Tenancy booking page
      navigate('/admin/end-of-tenancy');
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

  // Allow admin and sales_agent

  return (
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
                    </div>
                    
                    <div className="bg-white rounded-lg shadow p-6">
                      <NewBookingForm onBookingCreated={handleBookingCreated} />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-white rounded-lg shadow p-6">
                      <ServiceSelection onServiceSelect={handleServiceSelect} isAdminView={true} />
                    </div>
                  </div>
                )}
              </div>
  );
};

export default AdminAddBooking;
