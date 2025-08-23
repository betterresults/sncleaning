import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { UnifiedHeader } from '@/components/UnifiedHeader';
import { customerNavigation } from '@/lib/navigationItems';

// Extend Window interface to include fdforms
declare global {
  interface Window {
    fdforms: any[];
  }
}

const CustomerAirbnbForm = () => {
  const { user, userRole, signOut, customerId } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    // Load the embedded form script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.charset = 'UTF-8';
    script.async = true;
    script.src = `${window.location.protocol}//book.sncleaningservices.co.uk/js/iform.js?v=0.0.3`;

    // Initialize the form configuration
    window.fdforms = window.fdforms || [];
    window.fdforms.push({
      formId: 238370,
      host: "book.sncleaningservices.co.uk",
      formHeight: 100,
      el: "form_238370_1",
      center: 1,
      scroll: 0,
      customer_id: customerId // Pass customer_id to the form
    });

    // Add script to document
    const head = document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0];
    head.appendChild(script);

    // Cleanup function
    return () => {
      if (head && script.parentNode === head) {
        head.removeChild(script);
      }
    };
  }, [customerId]);

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
            title="Airbnb Cleaning Booking 🏠"
            user={user}
            userRole={userRole}
          />
          
          <main className="flex-1 w-full h-full">
            <div className="w-full h-full">
              {/* Embedded form container */}
              <div id="form_238370_1" className="w-full h-full min-h-screen"></div>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default CustomerAirbnbForm;