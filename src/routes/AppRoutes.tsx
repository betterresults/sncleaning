import { Routes, Route } from 'react-router-dom';
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
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<Dashboard />} />
        <Route path="/upcoming-bookings" element={<UpcomingBookings />} />
        <Route path="/bulk-edit-bookings" element={<BulkEditBookings />} />
        <Route path="/staff-settings" element={<StaffSettings />} />
        <Route path="/past-bookings" element={<PastBookings />} />
        <Route path="/cancelled-bookings" element={<CancelledBookings />} />
        <Route path="/admin-add-booking" element={<AdminAddBooking />} />
        <Route path="/admin-chat-management" element={<AdminChatManagement />} />
        <Route path="/admin-sms-messages" element={<AdminSMSMessages />} />
        <Route path="/admin-quote-requests" element={<AdminQuoteRequests />} />
        <Route path="/admin-quote-leads" element={<AdminQuoteLeads />} />
        <Route path="/create-customer-accounts" element={<CreateCustomerAccounts />} />
        <Route path="/recurring-bookings" element={<RecurringBookings />} />
        <Route path="/recurring-bookings/add" element={<AddRecurringBooking />} />
        <Route path="/recurring-bookings/edit/:id" element={<EditRecurringBooking />} />
        <Route path="/users/cleaners" element={<UsersCleaners />} />
        <Route path="/users/customers" element={<UsersCustomers />} />
        <Route path="/admin-linen-management" element={<AdminLinenManagement />} />
        <Route path="/admin-photo-management" element={<PhotoManagement />} />
        <Route path="/admin/airbnb" element={<AirbnbBooking />} />
        <Route path="/admin/domestic" element={<DomesticBooking />} />
        <Route path="/admin/carpet" element={<CarpetBooking />} />
        <Route path="/admin/end-of-tenancy" element={<EndOfTenancyBooking />} />
        <Route path="/admin/linen" element={<LinenOrder />} />
      </Route>

      {/* Admin only */}
      <Route element={<AdminRoute />}>
        <Route path="/admin-settings" element={<AdminSettings />} />
        <Route path="/users" element={<Users />} />
        <Route path="/users/admins" element={<UsersAdmins />} />
        <Route path="/admin-cleaner-payments" element={<AdminCleanerPayments />} />
        <Route path="/admin-cleaner-payments/add" element={<AdminAddCleanerPayment />} />
        <Route path="/admin-customer-payments" element={<AdminCustomerPayments />} />
        <Route path="/admin-payment-management" element={<AdminPaymentManagement />} />
        <Route path="/admin-profit-tracking" element={<AdminProfitTracking />} />
        <Route path="/admin-activity-logs" element={<AdminActivityLogs />} />
        <Route path="/admin-notification-management" element={<AdminNotificationManagement />} />
        <Route path="/admin-domestic-form-settings" element={<AdminDomesticFormSettings />} />
        <Route path="/admin-airbnb-form-settings" element={<AdminAirbnbFormSettings />} />
        <Route path="/admin-end-of-tenancy-form-settings" element={<AdminEndOfTenancyFormSettings />} />
        <Route path="/admin-carpet-cleaning-form-settings" element={<AdminCarpetCleaningFormSettings />} />
        <Route path="/admin-customer-pricing" element={<AdminCustomerPricing />} />
        <Route path="/admin-company-settings" element={<AdminCompanySettings />} />
        <Route path="/admin-coverage-management" element={<AdminCoverageManagement />} />
        <Route path="/admin-agent-tasks" element={<AdminAgentTasks />} />
      </Route>

      {/* Sales agent only */}
      <Route element={<SalesAgentRoute />}>
        <Route path="/agent-tasks" element={<AgentTasks />} />
      </Route>

      {/* Cleaner (+ admin impersonation) */}
      <Route element={<CleanerRoute />}>
        <Route path="/cleaner-dashboard" element={<CleanerDashboard />} />
        <Route path="/cleaner-today-bookings" element={<CleanerTodayBookings />} />
        <Route path="/cleaner-today" element={<CleanerTodayPage />} />
        <Route path="/cleaner-bookings" element={<CleanerBookingsPage />} />
        <Route path="/cleaner-upcoming-bookings" element={<CleanerUpcomingBookingsPage />} />
        <Route path="/cleaner-completed-bookings" element={<CleanerCompletedBookingsPage />} />
        <Route path="/cleaner-settings" element={<CleanerSettings />} />
        <Route path="/cleaner-messages" element={<CleanerMessages />} />
        <Route path="/cleaner-available-bookings" element={<CleanerAvailableBookings />} />
        <Route path="/cleaner-past-bookings" element={<CleanerPastBookings />} />
        <Route path="/cleaner-checklist/:bookingId" element={<CleanerChecklist />} />
        <Route path="/cleaner-earnings" element={<CleanerEarnings />} />
      </Route>

      {/* Customer (+ admin impersonation) */}
      <Route element={<CustomerRoute />}>
        <Route path="/customer-dashboard" element={<CustomerDashboard />} />
        <Route path="/customer-completed-bookings" element={<CustomerCompletedBookings />} />
        <Route path="/customer-settings" element={<CustomerSettings />} />
        <Route path="/customer-add-booking" element={<CustomerAddBooking />} />
        <Route path="/customer-linen-management" element={<CustomerLinenManagement />} />
        <Route path="/customer/airbnb-form" element={<AirbnbBooking />} />
        <Route path="/customer/linen-form" element={<LinenOrder />} />
      </Route>

      <Route element={<CustomerStrictRoute />}>
        <Route path="/customer-messages" element={<CustomerMessages />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
