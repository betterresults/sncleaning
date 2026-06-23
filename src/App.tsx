
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
import { FbclidCapture } from "./components/FbclidCapture";
import { AuthProvider } from "@/contexts/AuthContext";
import { devLog } from "@/lib/devLog";
import { AdminCustomerProvider } from "./contexts/AdminCustomerContext";
import { AdminCleanerProvider } from "./contexts/AdminCleanerContext";
import InstallPrompt from "./components/InstallPrompt";
import { AppRoutes } from "@/routes/AppRoutes";

const queryClient = new QueryClient();

const captureOriginalLandingUrl = () => {
  const SESSION_KEY = 'quote_session_id';
  const LANDING_URL_KEY = 'quote_original_landing_url';
  const SESSION_TIMESTAMP_KEY = 'quote_session_timestamp';
  const SESSION_REUSE_WINDOW = 30 * 60 * 1000;

  const existingSession = localStorage.getItem(SESSION_KEY);
  const sessionTimestamp = localStorage.getItem(SESSION_TIMESTAMP_KEY);
  const existingLandingUrl = localStorage.getItem(LANDING_URL_KEY);

  const isNewSession = !existingSession || !sessionTimestamp ||
    (Date.now() - parseInt(sessionTimestamp, 10)) > SESSION_REUSE_WINDOW;

  if (isNewSession || !existingLandingUrl) {
    localStorage.setItem(LANDING_URL_KEY, window.location.href);
    devLog('📊 Captured original landing URL:', window.location.href);
  }
};

captureOriginalLandingUrl();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <FbclidCapture />
        <AuthProvider>
          <AdminCustomerProvider>
            <AdminCleanerProvider>
              <AppRoutes />
            </AdminCleanerProvider>
          </AdminCustomerProvider>
        </AuthProvider>
        <InstallPrompt />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
