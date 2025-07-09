import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { UnifiedHeader } from '@/components/UnifiedHeader';
import { customerNavigation } from '@/lib/navigationItems';
import { Button } from '@/components/ui/button';
import ServiceSelection from '@/components/booking/ServiceSelection';
import NewBookingForm from '@/components/booking/NewBookingForm';
import { ArrowLeft } from 'lucide-react';

const CustomerAddBooking = () => {
  const { user, userRole, signOut } = useAuth();
  const [selectedService, setSelectedService] = useState<string | null>(null);

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
          navigationItems={customerNavigation}
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
                  <Button
                    variant="outline"
                    onClick={handleBackToServices}
                    className="flex items-center gap-2 text-[#185166] border-[#185166] hover:bg-[#185166] hover:text-white"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Services
                  </Button>
                  
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-6">
                    <NewBookingForm 
                      onBookingCreated={handleBookingCreated}
                    />
                  </div>
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