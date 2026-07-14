/** Page titles for the shell header, keyed by route path. */
const ROUTE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/admin': 'Dashboard',
  '/upcoming-bookings': 'Upcoming Bookings',
  '/bulk-edit-bookings': 'Bulk Edit Bookings',
  '/staff-settings': 'Settings',
  '/past-bookings': 'Completed Bookings',
  '/cancelled-bookings': 'Cancelled Bookings',
  '/admin-add-booking': 'Add Booking',
  '/admin-chat-management': 'Chat Management',
  '/admin-sms-messages': 'SMS Messages',
  '/admin-quote-requests': 'Quote Requests',
  '/admin-quote-leads': 'Quote Leads',
  '/create-customer-accounts': 'Account Utilities',
  '/recurring-bookings': 'Recurring Bookings',
  '/recurring-bookings/add': 'Add Recurring Booking',
  '/users/cleaners': 'Cleaners',
  '/users/customers': 'Customers',
  '/admin-linen-management': 'Linen Management',
  '/admin-photo-management': 'Photo Management',
  '/admin/airbnb': 'Airbnb Booking',
  '/admin/domestic': 'Domestic Booking',
  '/admin/carpet': 'Carpet Booking',
  '/admin/end-of-tenancy': 'End of Tenancy',
  '/admin/linen': 'Linen Order',
  '/admin-settings': 'Admin Settings',
  '/users': 'Users',
  '/users/admins': 'Admins',
  '/admin-cleaner-payments': 'Cleaner Payments',
  '/admin-cleaner-payments/add': 'Add Cleaner Payment',
  '/admin-customer-payments': 'Customer Payments',
  '/admin-payment-management': 'Payment Management',
  '/admin-profit-tracking': 'Profit Tracking',
  '/admin-activity-logs': 'Activity Logs',
  '/admin-notification-management': 'Notifications',
  '/admin-domestic-form-settings': 'Domestic Form Settings',
  '/admin-airbnb-form-settings': 'Airbnb Form Settings',
  '/admin-end-of-tenancy-form-settings': 'End of Tenancy Form Settings',
  '/admin-carpet-cleaning-form-settings': 'Carpet Form Settings',
  '/admin-customer-pricing': 'Customer Pricing',
  '/admin-company-settings': 'Company Settings',
  '/admin-coverage-management': 'Coverage Management',
  '/admin-agent-tasks': 'Agent Tasks',
  '/agent-tasks': 'My Tasks',
  '/cleaner-dashboard': 'My Bookings',
  '/cleaner-today-bookings': "Today's Work",
  '/cleaner-today': "Today's Work",
  '/cleaner-bookings': 'My Bookings',
  '/cleaner-upcoming-bookings': 'Upcoming Bookings',
  '/cleaner-completed-bookings': 'Completed Bookings',
  '/cleaner-settings': 'Settings',
  '/cleaner-messages': 'Messages',
  '/cleaner-available-bookings': 'Available Bookings',
  '/cleaner-past-bookings': 'Completed Bookings',
  '/cleaner-earnings': 'My Earnings',
  '/cleaner-availability': 'My Availability',
  '/customer-dashboard': 'Dashboard',
  '/customer-completed-bookings': 'Completed Bookings',
  '/customer-settings': 'Settings',
  '/customer-add-booking': 'Add Booking',
  '/customer-linen-management': 'Linen Management',
  '/customer-messages': 'Messages',
  '/customer/airbnb-form': 'Airbnb Booking',
  '/customer/domestic-form': 'Domestic Booking',
  '/customer/end-of-tenancy-form': 'End of Tenancy',
  '/customer/carpet-form': 'Carpet Cleaning',
  '/customer/linen-form': 'Linen Order',
};

export function getShellRouteTitle(pathname: string): string {
  if (ROUTE_TITLES[pathname]) {
    return ROUTE_TITLES[pathname];
  }

  if (pathname.startsWith('/recurring-bookings/edit/')) {
    return 'Edit Recurring Booking';
  }

  if (pathname.startsWith('/cleaner-checklist/')) {
    return 'Checklist';
  }

  if (pathname.startsWith('/admin/')) {
    const segment = pathname.split('/').filter(Boolean).pop() ?? '';
    return segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  return '';
}
