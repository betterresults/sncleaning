import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useCustomerLinenAccess } from '@/hooks/useCustomerLinenAccess';
import { Button } from '@/components/ui/button';
import ServiceSelection from '@/components/booking/ServiceSelection';
import NewBookingForm from '@/components/booking/NewBookingForm';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ShellLoading, ShellPage } from '@/layouts/shell';

const CustomerAddBooking = () => {
  const { user, userRole, signOut, customerId } = useAuth();
  const { hasLinenAccess } = useCustomerLinenAccess();
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [customerData, setCustomerData] = useState<any>(null);
  const navigate = useNavigate();

  // Fetch customer data when component mounts
  useEffect(() => {
    const fetchCustomerData = async () => {
      if (customerId) {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .eq('id', customerId)
          .single();
        
        if (data && !error) {
          setCustomerData(data);
        }
      }
    };

    fetchCustomerData();
  }, [customerId]);

  const handleServiceSelect = (serviceType: string) => {
    if (serviceType === 'airbnb-cleaning') {
      navigate('/customer/airbnb-form');
    } else if (serviceType === 'linen-order') {
      navigate('/customer/linen-form');
    } else if (serviceType === 'domestic-cleaning') {
      // Slot-filtered public funnel (ScheduleStep), not free-pick NewBookingForm
      navigate('/customer/domestic-form');
    } else if (serviceType === 'end-of-tenancy') {
      navigate('/customer/end-of-tenancy-form');
    } else if (serviceType === 'carpet-cleaning') {
      navigate('/customer/carpet-form');
    } else {
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

  return (
    <ShellPage width="wide">
                {selectedService ? (
                  <div className="space-y-6">
                  {selectedService !== 'airbnb-cleaning' && (
                    <Button
                      variant="outline"
                      onClick={handleBackToServices}
                      className="flex items-center gap-2 text-[#185166] border-[#185166] hover:bg-[#185166] hover:text-white"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back to Services
                    </Button>
                  )}
                  
                  {selectedService !== 'airbnb-cleaning' && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-6">
                      <NewBookingForm 
                        onBookingCreated={handleBookingCreated}
                        isCustomerView={true}
                        preselectedCustomer={customerData}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-8">
                  <ServiceSelection onServiceSelect={handleServiceSelect} isAdminView={false} />
                </div>
              )}
            </ShellPage>
  );
};

export default CustomerAddBooking;