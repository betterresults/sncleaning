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
    // Add customer_id to URL parameters for the form
    const currentUrl = new URL(window.location.href);
    if (customerId && !currentUrl.searchParams.has('customer_id')) {
      currentUrl.searchParams.set('customer_id', customerId.toString());
      window.history.replaceState({}, '', currentUrl.toString());
    }

    // Override body padding for this page
    const originalBodyStyle = document.body.style.cssText;
    document.body.style.padding = '0';
    document.body.style.margin = '0';

    // Load the embedded form script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.charset = 'UTF-8';
    script.async = true;
    script.src = `${window.location.protocol}//book.sncleaningservices.co.uk/js/iform.js?v=0.0.3`;

    // Initialize the form configuration with customer_id
    window.fdforms = window.fdforms || [];
    window.fdforms.push({
      formId: 238370,
      host: "book.sncleaningservices.co.uk",
      formHeight: 100,
      el: "form_238370_1",
      center: 1,
      scroll: 0,
      customer_id: customerId,
      // Also try passing it as form data
      formData: {
        customer_id: customerId
      }
    });

    // Add script to document
    const head = document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0];
    head.appendChild(script);

    // Cleanup function
    return () => {
      // Restore original body styling
      document.body.style.cssText = originalBodyStyle;
      
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
        <SidebarInset className="flex-1 flex flex-col p-0">
          <UnifiedHeader 
            title="Airbnb Cleaning Booking 🏠"
            user={user}
            userRole={userRole}
          />
          
          {/* Form takes full remaining space without any padding */}
          <div id="form_238370_1" className="flex-1 w-full p-0 m-0 border-0"></div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default CustomerAirbnbForm;