
import React, { useState, useEffect } from 'react';
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
import { AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAdminCustomer } from '@/contexts/AdminCustomerContext';
import { supabase } from '@/integrations/supabase/client';

const CustomerDashboard = () => {
  const { user, userRole, customerId, cleanerId, signOut } = useAuth();
  const { selectedCustomerId } = useAdminCustomer();
  const { hasLinenAccess, loading: linenLoading } = useCustomerLinenAccess();
  const { unpaidBookings, loading: paymentsLoading, refetch: refetchPayments } = useCustomerUnpaidBookings();
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(true);
  const [showBulkPayment, setShowBulkPayment] = useState(false);
  const [isBusinessClient, setIsBusinessClient] = useState(false);
  const [overdueInvoices, setOverdueInvoices] = useState([]);
  const isAdminViewing = userRole === 'admin';
  
  // Use selected customer ID if admin is viewing, otherwise use the logged-in user's customer ID  
  const activeCustomerId = userRole === 'admin' ? selectedCustomerId : customerId;

  // Fetch payment methods for the active customer
  const fetchPaymentMethods = async () => {
    if (!activeCustomerId) {
      setPaymentMethodsLoading(false);
      return;
    }
    
    try {
      setPaymentMethodsLoading(true);
      const { data, error } = await supabase
        .from('customer_payment_methods')
        .select('*')
        .eq('customer_id', activeCustomerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPaymentMethods(data || []);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      setPaymentMethods([]);
    } finally {
      setPaymentMethodsLoading(false);
    }
  };

  // Check if customer is business client
  const checkIfBusinessClient = async () => {
    if (!activeCustomerId) {
      setIsBusinessClient(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('clent_type')
        .eq('id', activeCustomerId)
        .single();

      if (error) throw error;
      setIsBusinessClient(data?.clent_type === 'business');
    } catch (error) {
      console.error('Error checking customer type:', error);
      setIsBusinessClient(false);
    }
  };

  // Check for overdue invoices
  const checkOverdueInvoices = async () => {
    if (!activeCustomerId || !isBusinessClient) {
      setOverdueInvoices([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('past_bookings')
        .select('*')
        .eq('customer', activeCustomerId)
        .not('invoice_link', 'is', null)
        .not('payment_status', 'ilike', '%paid%');

      if (error) throw error;

      const now = new Date();
      const overdue = (data || []).filter(booking => {
        const bookingDate = new Date(booking.date_time);
        const dueDate = new Date(bookingDate);
        dueDate.setDate(dueDate.getDate() + 8);
        return now > dueDate;
      });

      setOverdueInvoices(overdue);
    } catch (error) {
      console.error('Error checking overdue invoices:', error);
      setOverdueInvoices([]);
    }
  };

  useEffect(() => {
    fetchPaymentMethods();
    checkIfBusinessClient();
  }, [activeCustomerId]);

  useEffect(() => {
    if (isBusinessClient) {
      checkOverdueInvoices();
    }
  }, [activeCustomerId, isBusinessClient]);

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
          customerId={customerId}
          cleanerId={cleanerId}
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
              
              {/* Overdue Invoice Alert for Business Clients */}
              {isBusinessClient && overdueInvoices.length > 0 && (
                <Card className="border-2 border-red-200 bg-red-50/30 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-800">
                      <AlertTriangle className="h-5 w-5" />
                      Overdue Invoices - Immediate Action Required
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-red-700 mb-4">
                      You have {overdueInvoices.length} overdue invoice{overdueInvoices.length > 1 ? 's' : ''} that require immediate payment:
                    </p>
                    <div className="space-y-3">
                      {overdueInvoices.map((booking) => {
                        const bookingDate = new Date(booking.date_time);
                        const dueDate = new Date(bookingDate);
                        dueDate.setDate(dueDate.getDate() + 8);
                        const daysOverdue = Math.floor((new Date().getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
                        
                        return (
                          <div key={booking.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-white rounded border border-red-200">
                            <div className="space-y-1">
                              <p className="font-medium text-gray-900">
                                {new Date(booking.date_time).toLocaleDateString('en-GB')} - {booking.address}
                              </p>
                              <p className="text-sm text-gray-600">
                                Amount: £{parseFloat(booking.total_cost || '0').toFixed(2)} • {daysOverdue} days overdue
                              </p>
                            </div>
                            {booking.invoice_link && (
                              <Button 
                                asChild
                                className="bg-red-600 hover:bg-red-700 text-white font-semibold whitespace-nowrap"
                                size="sm"
                              >
                                <a href={booking.invoice_link} target="_blank" rel="noopener noreferrer">
                                  Pay Invoice
                                </a>
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Payment Method Setup Notification - Show for customers without payment methods (excluding business clients) */}
              {!paymentMethodsLoading && paymentMethods.length === 0 && activeCustomerId && !isBusinessClient && (
                <Card className="border-2 border-orange-200 bg-orange-50/30 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-800">
                      <AlertTriangle className="h-6 w-6" />
                      Payment Method Required
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
                      <div>
                        <p className="text-orange-700 mb-2">
                          We now use an automatic payment system. Please add a payment method to secure your bookings.
                        </p>
                        <p className="text-sm text-orange-600">
                          This ensures seamless and secure transactions for all your services.
                        </p>
                      </div>
                      <Link to="/customer-settings?tab=payments">
                        <Button className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors whitespace-nowrap">
                          <CreditCard className="h-5 w-5 mr-2" />
                          Add Payment Method
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )}
              
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
