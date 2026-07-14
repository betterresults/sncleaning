import { Routes, Route } from 'react-router-dom';
import { shellRoute } from '@/routes/shellRoute';
import {
  StaffRoute,
  AdminRoute,
  CleanerRoute,
  CustomerRoute,
  CustomerStrictRoute,
  SalesAgentRoute,
} from '@/components/ProtectedRoute';

import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import Dashboard from '@/pages/Dashboard';
import Users from '@/pages/Users';
import PastBookings from '@/pages/PastBookings';
import CancelledBookings from '@/pages/CancelledBookings';
import CleanerDashboard from '@/pages/CleanerDashboard';
import CleanerTodayBookings from '@/pages/CleanerTodayBookings';
import CleanerTodayPage from '@/pages/CleanerTodayPage';
import CleanerBookingsPage from '@/pages/CleanerBookingsPage';
import CleanerUpcomingBookingsPage from '@/pages/CleanerUpcomingBookingsPage';
import CleanerCompletedBookingsPage from '@/pages/CleanerCompletedBookingsPage';
import CustomerMessages from '@/pages/CustomerMessages';
import CleanerMessages from '@/pages/CleanerMessages';
import AdminChatManagement from '@/pages/AdminChatManagement';
import AdminSMSMessages from '@/pages/AdminSMSMessages';
import AdminCompanySettings from '@/pages/AdminCompanySettings';
import CleanerPastBookings from '@/pages/CleanerPastBookings';
import CleanerEarnings from '@/pages/CleanerEarnings';
import CleanerAvailableBookings from '@/pages/CleanerAvailableBookings';
import CustomerDashboard from '@/pages/CustomerDashboard';
import CustomerCompletedBookings from '@/pages/CustomerCompletedBookings';
import CustomerSettings from '@/pages/CustomerSettings';
import CustomerAddBooking from '@/pages/CustomerAddBooking';
import PublicServiceSelection from '@/pages/PublicServiceSelection';
import ChooseService from '@/pages/ChooseService';
import CustomerPhotos from '@/pages/CustomerPhotos';
import CustomerLinenManagement from '@/pages/CustomerLinenManagement';
import CreateCustomerAccounts from '@/pages/CreateCustomerAccounts';
import AirbnbBooking from '@/pages/AirbnbBooking';
import DomesticBooking from '@/pages/DomesticBooking';
import CarpetBooking from '@/pages/CarpetBooking';
import EndOfTenancyBooking from '@/pages/EndOfTenancyBooking';
import AdminDomesticFormSettings from '@/pages/AdminDomesticFormSettings';
import LinenOrder from '@/pages/LinenOrder';
import BookingConfirmation from '@/pages/BookingConfirmation';
import PaymentFailed from '@/pages/PaymentFailed';
import AdminAddBooking from '@/pages/AdminAddBooking';
import CleanerSettings from '@/pages/CleanerSettings';
import CleanerAvailability from '@/pages/CleanerAvailability';
import CleanerChecklist from '@/pages/CleanerChecklist';
import AdminSettings from '@/pages/AdminSettings';
import StaffSettings from '@/pages/StaffSettings';
import RecurringBookings from '@/pages/RecurringBookings';
import AddRecurringBooking from '@/pages/AddRecurringBooking';
import EditRecurringBooking from '@/pages/EditRecurringBooking';
import AdminCleanerPayments from '@/pages/AdminCleanerPayments';
import AdminAddCleanerPayment from '@/pages/AdminAddCleanerPayment';
import AdminCustomerPayments from '@/pages/AdminCustomerPayments';
import AdminPaymentManagement from '@/pages/AdminPaymentManagement';
import UpcomingBookings from '@/pages/UpcomingBookings';
import BulkEditBookings from '@/pages/BulkEditBookings';
import UsersAdmins from '@/pages/UsersAdmins';
import UsersCleaners from '@/pages/UsersCleaners';
import UsersCustomers from '@/pages/UsersCustomers';
import AdminLinenManagement from '@/pages/AdminLinenManagement';
import AdminProfitTracking from '@/pages/AdminProfitTracking';
import AdminActivityLogs from '@/pages/AdminActivityLogs';
import AdminNotificationManagement from '@/pages/AdminNotificationManagement';
import ApplyToWork from '@/pages/ApplyToWork';
import QuoteRequest from '@/pages/QuoteRequest';
import AdminQuoteRequests from '@/pages/AdminQuoteRequests';
import LandingPage from '@/pages/LandingPage';
import FreeQuote from '@/pages/FreeQuote';
import AdminAirbnbFormSettings from '@/pages/AdminAirbnbFormSettings';
import AdminEndOfTenancyFormSettings from '@/pages/AdminEndOfTenancyFormSettings';
import AdminCarpetCleaningFormSettings from '@/pages/AdminCarpetCleaningFormSettings';
import AdminCustomerPricing from '@/pages/AdminCustomerPricing';
import CustomerWelcome from '@/pages/CustomerWelcome';
import AdminQuoteLeads from '@/pages/AdminQuoteLeads';
import AdminCoverageManagement from '@/pages/AdminCoverageManagement';
import CheckCoverage from '@/pages/CheckCoverage';
import ShortLinkResolver from '@/pages/ShortLinkResolver';
import NotFound from '@/pages/NotFound';
import AdminAgentTasks from '@/pages/AdminAgentTasks';
import AgentTasks from '@/pages/AgentTasks';
import PhotoManagement from '@/pages/PhotoManagement';

export function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/welcome" element={<CustomerWelcome />} />
      <Route path="/choose-service" element={<PublicServiceSelection />} />
      <Route path="/services" element={<ChooseService />} />
      <Route path="/airbnb" element={<AirbnbBooking />} />
      <Route path="/domestic" element={<DomesticBooking />} />
      <Route path="/domestic-cleaning" element={<DomesticBooking />} />
      <Route path="/domestic-booking" element={<DomesticBooking />} />
      <Route path="/airbnb-cleaning" element={<AirbnbBooking />} />
      <Route path="/b/:shortCode" element={<ShortLinkResolver />} />
      <Route path="/linen-order" element={<LinenOrder />} />
      <Route path="/booking-confirmation" element={<BookingConfirmation />} />
      <Route path="/payment-failed" element={<PaymentFailed />} />
      <Route path="/apply" element={<ApplyToWork />} />
      <Route path="/quote-request" element={<QuoteRequest />} />
      <Route path="/customer/quote-request" element={<QuoteRequest />} />
      <Route path="/lp" element={<LandingPage />} />
      <Route path="/get-quote" element={<LandingPage />} />
      <Route path="/free-quote" element={<FreeQuote />} />
      <Route path="/carpet-cleaning" element={<CarpetBooking />} />
      <Route path="/end-of-tenancy" element={<EndOfTenancyBooking />} />
      <Route path="/end-of-tenancy-cleaning" element={<EndOfTenancyBooking />} />
      <Route path="/coverage" element={<CheckCoverage />} />
      <Route path="/photos/:folderName" element={<CustomerPhotos />} />

      {/* Staff: admin + sales agent */}
      <Route element={<StaffRoute />}>
        {shellRoute('/dashboard', <Dashboard />)}
        {shellRoute('/admin', <Dashboard />)}
        {shellRoute('/upcoming-bookings', <UpcomingBookings />)}
        {shellRoute('/bulk-edit-bookings', <BulkEditBookings />)}
        {shellRoute('/staff-settings', <StaffSettings />)}
        {shellRoute('/past-bookings', <PastBookings />)}
        {shellRoute('/cancelled-bookings', <CancelledBookings />)}
        {shellRoute('/admin-add-booking', <AdminAddBooking />)}
        {shellRoute('/admin-chat-management', <AdminChatManagement />)}
        {shellRoute('/admin-sms-messages', <AdminSMSMessages />)}
        {shellRoute('/admin-quote-requests', <AdminQuoteRequests />)}
        {shellRoute('/admin-quote-leads', <AdminQuoteLeads />)}
        {shellRoute('/create-customer-accounts', <CreateCustomerAccounts />)}
        {shellRoute('/recurring-bookings', <RecurringBookings />)}
        {shellRoute('/recurring-bookings/add', <AddRecurringBooking />)}
        {shellRoute('/recurring-bookings/edit/:id', <EditRecurringBooking />, 'Edit Recurring Booking')}
        {shellRoute('/users/cleaners', <UsersCleaners />)}
        {shellRoute('/users/customers', <UsersCustomers />)}
        {shellRoute('/admin-linen-management', <AdminLinenManagement />)}
        {shellRoute('/admin-photo-management', <PhotoManagement />)}
        {shellRoute('/admin/airbnb', <AirbnbBooking />, 'Airbnb Booking')}
        {shellRoute('/admin/domestic', <DomesticBooking />, 'Domestic Booking')}
        {shellRoute('/admin/carpet', <CarpetBooking />, 'Carpet Booking')}
        {shellRoute('/admin/end-of-tenancy', <EndOfTenancyBooking />, 'End of Tenancy')}
        {shellRoute('/admin/linen', <LinenOrder />, 'Linen Order')}
      </Route>

      {/* Admin only */}
      <Route element={<AdminRoute />}>
        {shellRoute('/admin-settings', <AdminSettings />)}
        {shellRoute('/users', <Users />)}
        {shellRoute('/users/admins', <UsersAdmins />)}
        {shellRoute('/admin-cleaner-payments', <AdminCleanerPayments />)}
        {shellRoute('/admin-cleaner-payments/add', <AdminAddCleanerPayment />)}
        {shellRoute('/admin-customer-payments', <AdminCustomerPayments />)}
        {shellRoute('/admin-payment-management', <AdminPaymentManagement />)}
        {shellRoute('/admin-profit-tracking', <AdminProfitTracking />)}
        {shellRoute('/admin-activity-logs', <AdminActivityLogs />)}
        {shellRoute('/admin-notification-management', <AdminNotificationManagement />)}
        {shellRoute('/admin-domestic-form-settings', <AdminDomesticFormSettings />)}
        {shellRoute('/admin-airbnb-form-settings', <AdminAirbnbFormSettings />)}
        {shellRoute('/admin-end-of-tenancy-form-settings', <AdminEndOfTenancyFormSettings />)}
        {shellRoute('/admin-carpet-cleaning-form-settings', <AdminCarpetCleaningFormSettings />)}
        {shellRoute('/admin-customer-pricing', <AdminCustomerPricing />)}
        {shellRoute('/admin-company-settings', <AdminCompanySettings />)}
        {shellRoute('/admin-coverage-management', <AdminCoverageManagement />)}
        {shellRoute('/admin-agent-tasks', <AdminAgentTasks />)}
      </Route>

      {/* Sales agent only */}
      <Route element={<SalesAgentRoute />}>
        {shellRoute('/agent-tasks', <AgentTasks />)}
      </Route>

      {/* Cleaner (+ admin impersonation) */}
      <Route element={<CleanerRoute />}>
        {shellRoute('/cleaner-dashboard', <CleanerDashboard />)}
        {shellRoute('/cleaner-today-bookings', <CleanerTodayBookings />)}
        {shellRoute('/cleaner-today', <CleanerTodayPage />)}
        {shellRoute('/cleaner-bookings', <CleanerBookingsPage />)}
        {shellRoute('/cleaner-upcoming-bookings', <CleanerUpcomingBookingsPage />)}
        {shellRoute('/cleaner-completed-bookings', <CleanerCompletedBookingsPage />)}
        {shellRoute('/cleaner-availability', <CleanerAvailability />)}
        {shellRoute('/cleaner-settings', <CleanerSettings />)}
        {shellRoute('/cleaner-messages', <CleanerMessages />)}
        {shellRoute('/cleaner-available-bookings', <CleanerAvailableBookings />)}
        {shellRoute('/cleaner-past-bookings', <CleanerPastBookings />)}
        {shellRoute('/cleaner-checklist/:bookingId', <CleanerChecklist />, 'Checklist')}
        {shellRoute('/cleaner-earnings', <CleanerEarnings />)}
      </Route>

      {/* Customer (+ admin impersonation) */}
      <Route element={<CustomerRoute />}>
        {shellRoute('/customer-dashboard', <CustomerDashboard />)}
        {shellRoute('/customer-completed-bookings', <CustomerCompletedBookings />)}
        {shellRoute('/customer-settings', <CustomerSettings />)}
        {shellRoute('/customer-add-booking', <CustomerAddBooking />)}
        {shellRoute('/customer-linen-management', <CustomerLinenManagement />)}
        {shellRoute('/customer/airbnb-form', <AirbnbBooking />, 'Airbnb Booking')}
        {shellRoute('/customer/domestic-form', <DomesticBooking />, 'Domestic Booking')}
        {shellRoute('/customer/end-of-tenancy-form', <EndOfTenancyBooking />, 'End of Tenancy')}
        {shellRoute('/customer/carpet-form', <CarpetBooking />, 'Carpet Cleaning')}
        {shellRoute('/customer/linen-form', <LinenOrder />, 'Linen Order')}
      </Route>

      <Route element={<CustomerStrictRoute />}>
        {shellRoute('/customer-messages', <CustomerMessages />)}
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
