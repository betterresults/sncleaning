
import React, { useState } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { UnifiedHeader } from '@/components/UnifiedHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, MapPin, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomerLinenAccess } from '@/hooks/useCustomerLinenAccess';
import { getCustomerNavigation } from '@/lib/navigationItems';
import AdminCustomerSelector from '@/components/admin/AdminCustomerSelector';
import CustomerUpcomingBookings from '@/components/customer/CustomerUpcomingBookings';
import { BulkPaymentDialog } from '@/components/customer/BulkPaymentDialog';
import { useCustomerUnpaidBookings } from '@/hooks/useCustomerUnpaidBookings';

const CustomerDashboard = () => {
  const { user, userRole, signOut } = useAuth();
  const { hasLinenAccess, loading: linenLoading } = useCustomerLinenAccess();
  const { unpaidBookings, loading: paymentsLoading, refetch: refetchPayments } = useCustomerUnpaidBookings();
  const [showBulkPayment, setShowBulkPayment] = useState(false);
  const isAdminViewing = userRole === 'admin';

  console.log('CustomerDashboard render - hasLinenAccess:', hasLinenAccess, 'loading:', linenLoading);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <UnifiedSidebar
          navigationItems={getCustomerNavigation(hasLinenAccess)}
          user={user}
          onSignOut={handleSignOut}
        />
        <SidebarInset className="flex-1 flex flex-col w-full">
          <UnifiedHeader 
            title="Customer Dashboard 🏠"
            user={user}
            userRole={userRole}
          />
          
          <main className="flex-1 p-2 sm:p-4 lg:p-6 w-full overflow-x-hidden">
            <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-6">
              {isAdminViewing && <AdminCustomerSelector />}
              
              {/* Bulk Payment Card */}
              {unpaidBookings.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Outstanding Payments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          You have {unpaidBookings.length} unpaid booking{unpaidBookings.length !== 1 ? 's' : ''}
                        </p>
                        <p className="text-lg font-semibold">
                          Total: £{unpaidBookings.reduce((sum, booking) => sum + booking.total_cost, 0).toFixed(2)}
                        </p>
                      </div>
                      <Button onClick={() => setShowBulkPayment(true)}>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Pay All
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <CustomerUpcomingBookings />
            </div>
          </main>
        </SidebarInset>
      </div>
      
      <BulkPaymentDialog
        open={showBulkPayment}
        onOpenChange={setShowBulkPayment}
        unpaidBookings={unpaidBookings}
        onPaymentSuccess={() => {
          refetchPayments();
          setShowBulkPayment(false);
        }}
      />
    </SidebarProvider>
  );
};

export default CustomerDashboard;
