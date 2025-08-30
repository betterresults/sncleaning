
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
      console.log('Starting sign out process...');
      await signOut();
      console.log('Sign out completed');
      // Redirect to auth page after successful sign out
      window.location.href = '/auth';
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
          userRole={userRole}
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
              
              {/* Outstanding Payments Card - Only show for customers with actual outstanding payments */}
              {userRole !== 'admin' && !paymentsLoading && unpaidBookings.length > 0 && (
                <Card className="border-2 border-red-200 bg-red-50/30 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-800">
                      <CreditCard className="h-6 w-6" />
                      Outstanding Payments ({unpaidBookings.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {paymentsLoading ? (
                      <div className="text-center py-4">
                        <div className="text-sm text-gray-600">Loading outstanding payments...</div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {(() => {
                          const cleaningBookings = unpaidBookings.filter(b => b.source === 'past_booking');
                          const linenOrders = unpaidBookings.filter(b => b.source === 'linen_order');
                          const totalAmount = unpaidBookings.reduce((sum, booking) => sum + booking.total_cost, 0);
                          
                          return (
                            <div className="space-y-4">
                              {/* Summary */}
                              <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-red-200">
                                <div>
                                  <div className="space-y-1">
                                    {cleaningBookings.length > 0 && (
                                      <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Calendar className="h-4 w-4" />
                                        <span>{cleaningBookings.length} Completed Cleaning Service{cleaningBookings.length !== 1 ? 's' : ''}</span>
                                      </div>
                                    )}
                                    {linenOrders.length > 0 && (
                                      <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Clock className="h-4 w-4" />
                                        <span>{linenOrders.length} Linen Order{linenOrders.length !== 1 ? 's' : ''}</span>
                                      </div>
                                    )}
                                  </div>
                                  <p className="text-2xl font-bold text-red-800 mt-2">
                                    Total: £{totalAmount.toFixed(2)}
                                  </p>
                                </div>
                                <Button 
                                  onClick={() => setShowBulkPayment(true)}
                                  className="bg-[#18A5A5] hover:bg-[#185166] text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                                  size="lg"
                                >
                                  <CreditCard className="h-5 w-5 mr-2" />
                                  Pay All Now
                                </Button>
                              </div>

                              {/* Detailed Breakdown */}
                              {cleaningBookings.length > 0 && (
                                <div className="bg-white rounded-lg p-4 border border-gray-200">
                                  <h4 className="font-semibold text-[#185166] mb-3 flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Completed Cleaning Services
                                  </h4>
                                  <div className="space-y-2">
                                    {cleaningBookings.slice(0, 3).map((booking) => (
                                      <div key={booking.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                                        <div>
                                          <div className="font-medium text-sm">{booking.cleaning_type}</div>
                                          <div className="text-xs text-gray-500">
                                            {new Date(booking.date_time).toLocaleDateString('en-GB')} • {booking.address}
                                          </div>
                                        </div>
                                         <div className="text-right">
                                           <div className="font-bold text-red-600">£{booking.total_cost.toFixed(2)}</div>
                                         </div>
                                      </div>
                                    ))}
                                    {cleaningBookings.length > 3 && (
                                      <div className="text-sm text-gray-500 text-center py-2">
                                        + {cleaningBookings.length - 3} more cleaning services
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Linen Orders Breakdown */}
                              {linenOrders.length > 0 && (
                                <div className="bg-white rounded-lg p-4 border border-gray-200">
                                  <h4 className="font-semibold text-[#185166] mb-3 flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    Linen Orders
                                  </h4>
                                  <div className="space-y-2">
                                    {linenOrders.slice(0, 3).map((order) => (
                                      <div key={order.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                                        <div>
                                          <div className="font-medium text-sm">{order.cleaning_type}</div>
                                          <div className="text-xs text-gray-500">
                                            {new Date(order.date_time).toLocaleDateString('en-GB')} • {order.address}
                                          </div>
                                        </div>
                                         <div className="text-right">
                                           <div className="font-bold text-red-600">£{order.total_cost.toFixed(2)}</div>
                                         </div>
                                      </div>
                                    ))}
                                    {linenOrders.length > 3 && (
                                      <div className="text-sm text-gray-500 text-center py-2">
                                        + {linenOrders.length - 3} more linen orders
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
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
