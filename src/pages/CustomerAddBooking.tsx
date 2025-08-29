import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { UnifiedHeader } from '@/components/UnifiedHeader';
import { getCustomerNavigation } from '@/lib/navigationItems';
import { useCustomerLinenAccess } from '@/hooks/useCustomerLinenAccess';
import { Button } from '@/components/ui/button';
import ServiceSelection from '@/components/booking/ServiceSelection';
import NewBookingForm from '@/components/booking/NewBookingForm';
import AirbnbBookingForm from '@/components/booking/AirbnbBookingForm';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const CustomerAddBooking = () => {
  const { user, userRole, signOut, customerId } = useAuth();
  const { hasLinenAccess } = useCustomerLinenAccess();
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [customerData, setCustomerData] = useState<any>(null);

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

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleServiceSelect = (serviceType: string) => {
    setSelectedService(serviceType);
  };

  const handleBackToServices = () => {
    setSelectedService(null);
  };

  const handleBookingCreated = () => {
    // Reset to service selection after booking is created
    setSelectedService(null);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 to-blue-50">
        <UnifiedSidebar 
          navigationItems={getCustomerNavigation(hasLinenAccess)}
          user={user}
          onSignOut={handleSignOut}
        />
        <SidebarInset className="flex-1">
          <UnifiedHeader 
            title={selectedService ? "Book Your Service ➕" : "Select a Service 🛎️"}
            user={user}
            userRole={userRole}
          />
          
          <main className="flex-1 p-4 space-y-4 max-w-full overflow-x-hidden">
            <div className="max-w-7xl mx-auto">
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
                  
                  {selectedService === 'airbnb-cleaning' && customerData ? (
                    <AirbnbBookingForm 
                      customerData={customerData}
                      onBookingCreated={handleBookingCreated}
                    />
                  ) : selectedService !== 'airbnb-cleaning' ? (
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-6">
                      <NewBookingForm 
                        onBookingCreated={handleBookingCreated}
                        isCustomerView={true}
                        preselectedCustomer={customerData}
                      />
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-8">
                  <ServiceSelection onServiceSelect={handleServiceSelect} />
                </div>
              )}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default CustomerAddBooking;