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
      if (head && script.parentNode === head) {
        head.removeChild(script);
      }
    };
  }, [customerId]);

  return (
    <div className="w-full h-screen overflow-hidden p-0 m-0">
      {/* Embedded form container - completely full screen */}
      <div id="form_238370_1" className="w-full h-full p-0 m-0 border-0"></div>
    </div>
  );
};

export default CustomerAirbnbForm;