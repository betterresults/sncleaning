
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";

import Users from "./pages/Users";
import PastBookings from "./pages/PastBookings";
import CleanerDashboard from "./pages/CleanerDashboard";
import CleanerTodayBookings from "./pages/CleanerTodayBookings";
import CustomerMessages from "./pages/CustomerMessages";
import CleanerMessages from "./pages/CleanerMessages";
import AdminChatManagement from "./pages/AdminChatManagement";
import AdminPricingFormulas from "./pages/AdminPricingFormulas";
import AdminCompanySettings from "./pages/AdminCompanySettings";
import CleanerPastBookings from "./pages/CleanerPastBookings";
import CleanerEarnings from "./pages/CleanerEarnings";
import CleanerAvailableBookings from "./pages/CleanerAvailableBookings";
import CustomerDashboard from "./pages/CustomerDashboard";
import CustomerCompletedBookings from "./pages/CustomerCompletedBookings";
import CustomerSettings from "./pages/CustomerSettings";
import CustomerAddBooking from "./pages/CustomerAddBooking";
import CustomerPhotos from "./pages/CustomerPhotos";
import CustomerAirbnbForm from "./pages/CustomerAirbnbForm";
import CustomerLinenManagement from './pages/CustomerLinenManagement';
import CreateCustomerAccounts from "./pages/CreateCustomerAccounts";
import AirbnbBooking from "./pages/AirbnbBooking";
import BookingConfirmation from "./pages/BookingConfirmation";
import AdminAddBooking from "./pages/AdminAddBooking";
import AdminAirbnbBooking from "./pages/AdminAirbnbBooking";
import CleanerSettings from './pages/CleanerSettings';
import CleanerChecklists from './pages/CleanerChecklists';
import CleanerChecklist from './pages/CleanerChecklist';
import AdminSettings from "./pages/AdminSettings";
import RecurringBookings from "./pages/RecurringBookings";
import AddRecurringBooking from "./pages/AddRecurringBooking";
import EditRecurringBooking from "./pages/EditRecurringBooking";
import AdminCleanerPayments from "./pages/AdminCleanerPayments";
import AdminCustomerPayments from "./pages/AdminCustomerPayments";
import AdminPaymentManagement from "./pages/AdminPaymentManagement";
import AdminStripePayments from "./pages/AdminStripePayments";
import UpcomingBookings from "./pages/UpcomingBookings";
import BulkEditBookings from "./pages/BulkEditBookings";
import UsersAdmins from "./pages/UsersAdmins";
import UsersCleaners from "./pages/UsersCleaners";
import UsersCustomers from "./pages/UsersCustomers";
import AdminLinenManagement from "./pages/AdminLinenManagement";
import AdminProfitTracking from "./pages/AdminProfitTracking";
import AdminActivityLogs from "./pages/AdminActivityLogs";
import AdminNotificationManagement from "./pages/AdminNotificationManagement";
import InvoilessAPITest from "./pages/InvoilessAPITest";
import AdminAirbnbFormSettings from "./pages/AdminAirbnbFormSettings";
import NotFound from "./pages/NotFound";
import { AdminCustomerProvider } from "./contexts/AdminCustomerContext";
import { AdminCleanerProvider } from "./contexts/AdminCleanerContext";
import InstallPrompt from "./components/InstallPrompt";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AdminCustomerProvider>
            <AdminCleanerProvider>
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/airbnb" element={<AirbnbBooking />} />
            <Route path="/booking-confirmation" element={<BookingConfirmation />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/upcoming-bookings" element={<UpcomingBookings />} />
            <Route path="/bulk-edit-bookings" element={<BulkEditBookings />} />
            <Route path="/admin" element={<Dashboard />} />
            <Route path="/admin-settings" element={<AdminSettings />} />
            <Route path="/users" element={<Users />} />
            <Route path="/past-bookings" element={<PastBookings />} />
            <Route path="/cleaner-dashboard" element={<CleanerDashboard />} />
           <Route path="/cleaner-today-bookings" element={<CleanerTodayBookings />} />
           <Route path="/cleaner-settings" element={<CleanerSettings />} />
           <Route path="/customer-messages" element={<CustomerMessages />} />
           <Route path="/cleaner-messages" element={<CleanerMessages />} />
           <Route path="/admin-chat-management" element={<AdminChatManagement />} />
           <Route path="/admin-pricing-formulas" element={<AdminPricingFormulas />} />
              <Route path="/cleaner-available-bookings" element={<CleanerAvailableBookings />} />
            <Route path="/cleaner-past-bookings" element={<CleanerPastBookings />} />
          <Route path="/cleaner-checklist/:bookingId" element={<CleanerChecklist />} />
            <Route path="/cleaner-earnings" element={<CleanerEarnings />} />
              <Route path="/customer-dashboard" element={<CustomerDashboard />} />
              <Route path="/customer-completed-bookings" element={<CustomerCompletedBookings />} />
                <Route path="/customer-settings" element={<CustomerSettings />} />
                 <Route path="/customer-add-booking" element={<CustomerAddBooking />} />
          <Route path="/customer-linen-management" element={<CustomerLinenManagement />} />
                 <Route path="/customer/airbnb-form" element={<CustomerAirbnbForm />} />
               <Route path="/admin-add-booking" element={<AdminAddBooking />} />
               <Route path="/admin/airbnb" element={<AdminAirbnbBooking />} />
               <Route path="/photos/:folderName" element={<CustomerPhotos />} />
               <Route path="/create-customer-accounts" element={<CreateCustomerAccounts />} />
                <Route path="/recurring-bookings" element={<RecurringBookings />} />
                <Route path="/recurring-bookings/add" element={<AddRecurringBooking />} />
                <Route path="/recurring-bookings/edit/:id" element={<EditRecurringBooking />} />
                 <Route path="/admin-cleaner-payments" element={<AdminCleanerPayments />} />
                 <Route path="/admin-customer-payments" element={<AdminCustomerPayments />} />
                 <Route path="/admin-payment-management" element={<AdminPaymentManagement />} />
                 <Route path="/admin-stripe-payments" element={<AdminStripePayments />} />
                  <Route path="/users/admins" element={<UsersAdmins />} />
                  <Route path="/users/cleaners" element={<UsersCleaners />} />
                  <Route path="/users/customers" element={<UsersCustomers />} />
                   <Route path="/admin-linen-management" element={<AdminLinenManagement />} />
                   <Route path="/admin-profit-tracking" element={<AdminProfitTracking />} />
                   <Route path="/admin-activity-logs" element={<AdminActivityLogs />} />
                    <Route path="/admin-notification-management" element={<AdminNotificationManagement />} />
                    <Route path="/invoiless-api-test" element={<InvoilessAPITest />} />
                     <Route path="/admin-airbnb-form-settings" element={<AdminAirbnbFormSettings />} />
                     <Route path="/admin-company-settings" element={<AdminCompanySettings />} />
                     {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
            </Routes>
              </AdminCleanerProvider>
            </AdminCustomerProvider>
          </AuthProvider>
          <InstallPrompt />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
