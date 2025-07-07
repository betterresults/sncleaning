
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Users from "./pages/Users";
import PastBookings from "./pages/PastBookings";
import CleanerDashboard from "./pages/CleanerDashboard";
import CleanerPastBookings from "./pages/CleanerPastBookings";
import CleanerEarnings from "./pages/CleanerEarnings";
import CleanerAvailableBookings from "./pages/CleanerAvailableBookings";
import CustomerDashboard from "./pages/CustomerDashboard";
import CustomerCompletedBookings from "./pages/CustomerCompletedBookings";
import CustomerSettings from "./pages/CustomerSettings";
import CustomerAddBooking from "./pages/CustomerAddBooking";
import CreateCustomerAccounts from "./pages/CreateCustomerAccounts";
import AdminCustomerPortalView from "./pages/AdminCustomerPortalView";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/past-bookings" element={<PastBookings />} />
            <Route path="/cleaner-dashboard" element={<CleanerDashboard />} />
            <Route path="/cleaner-available-bookings" element={<CleanerAvailableBookings />} />
            <Route path="/cleaner-past-bookings" element={<CleanerPastBookings />} />
            <Route path="/cleaner-earnings" element={<CleanerEarnings />} />
            <Route path="/customer-dashboard" element={<CustomerDashboard />} />
            <Route path="/customer-completed-bookings" element={<CustomerCompletedBookings />} />
            <Route path="/customer-settings" element={<CustomerSettings />} />
            <Route path="/customer-add-booking" element={<CustomerAddBooking />} />
            <Route path="/create-customer-accounts" element={<CreateCustomerAccounts />} />
            <Route path="/admin-customer-portal" element={<AdminCustomerPortalView />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
