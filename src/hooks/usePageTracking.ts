import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useActivityLogger } from './useActivityLogger';

// Hook to automatically track page visits
export const usePageTracking = (pageName?: string) => {
  const location = useLocation();
  const { logPageVisit } = useActivityLogger();

  useEffect(() => {
    const pageTitle = pageName || getPageNameFromPath(location.pathname);
    logPageVisit(pageTitle);
  }, [location.pathname, pageName, logPageVisit]);
};

// Helper function to get page name from pathname
const getPageNameFromPath = (pathname: string): string => {
  const pathMap: Record<string, string> = {
    '/': 'Dashboard',
    '/dashboard': 'Dashboard',
    '/customer-dashboard': 'Customer Dashboard',
    '/cleaner-dashboard': 'Cleaner Dashboard',
    '/bookings': 'Bookings',
    '/past-bookings': 'Past Bookings',
    '/upcoming-bookings': 'Upcoming Bookings',
    '/users': 'Users',
    '/users-customers': 'Customers',
    '/users-cleaners': 'Cleaners',
    '/users-admins': 'Admins',
    '/customer-completed-bookings': 'Customer Completed Bookings',
    '/customer-add-booking': 'Add Booking',
    '/customer-settings': 'Customer Settings',
    '/cleaner-available-bookings': 'Available Bookings',
    '/cleaner-past-bookings': 'Cleaner Past Bookings',
    '/cleaner-earnings': 'Cleaner Earnings',
    '/cleaner-settings': 'Cleaner Settings',
    '/admin-settings': 'Admin Settings',
    '/admin-payment-management': 'Payment Management',
    '/admin-linen-management': 'Linen Management',
    '/admin-chat-management': 'Chat Management'
  };

  return pathMap[pathname] || pathname.replace('/', '').replace(/-/g, ' ');
};