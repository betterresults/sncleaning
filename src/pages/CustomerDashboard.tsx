
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, MapPin, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomerLinenAccess } from '@/hooks/useCustomerLinenAccess';
import AdminCustomerSelector from '@/components/admin/AdminCustomerSelector';
import CustomerUpcomingBookings from '@/components/customer/CustomerUpcomingBookings';
import { BulkPaymentDialog } from '@/components/customer/BulkPaymentDialog';
import { useCustomerUnpaidBookings } from '@/hooks/useCustomerUnpaidBookings';
import {
  useCustomerIsBusinessClient,
  useCustomerOverdueInvoices,
  useCustomerPaymentMethodsList,
} from '@/hooks/queries/useCustomerPortal';
import { AlertTriangle } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAdminCustomer } from '@/contexts/AdminCustomerContext';
import { useToast } from '@/hooks/use-toast';
import { ShellLoading, ShellPage } from '@/layouts/shell';
import { formatUK, formatUKDate, formatUKTime, formatUKDateTime, formatUKLocaleDate, formatUKLocaleTime, getUKNowAsLocalDate, getUKStoredAsLocalDate } from '@/lib/ukTime';

const CustomerDashboard = () => {
  const { user, userRole, customerId, cleanerId, signOut, loading } = useAuth();
  const { selectedCustomerId } = useAdminCustomer();
  const { hasLinenAccess, loading: linenLoading } = useCustomerLinenAccess();
  const { toast } = useToast();

  const activeCustomerId = userRole === 'admin' ? selectedCustomerId : customerId;

  const { unpaidBookings, loading: paymentsLoading, refetch: refetchPayments } = useCustomerUnpaidBookings();
  const {
    data: paymentMethods = [],
    isLoading: paymentMethodsLoading,
    refetch: refetchPaymentMethods,
  } = useCustomerPaymentMethodsList(activeCustomerId);
  const { data: isBusinessClient = false } = useCustomerIsBusinessClient(activeCustomerId);
  const { data: overdueInvoices = [] } = useCustomerOverdueInvoices(
    activeCustomerId,
    isBusinessClient,
  );
  const [showBulkPayment, setShowBulkPayment] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const isAdminViewing = userRole === 'admin';

  // Handle payment_setup success parameter
  useEffect(() => {
    if (searchParams.get('payment_setup') === 'success') {
      toast({
        title: "Payment method added",
        description: "Your payment method has been successfully saved.",
      });
      searchParams.delete('payment_setup');
      setSearchParams(searchParams, { replace: true });
      refetchPaymentMethods();
    }
  }, [searchParams]);

  console.log('CustomerDashboard render - hasLinenAccess:', hasLinenAccess, 'loading:', linenLoading);

  // Auth checks AFTER all hooks
  if (loading) {
    return <ShellLoading message="Loading dashboard…" />;
  }

  return (
    <ShellPage width="wide">
                {isAdminViewing && <AdminCustomerSelector />}
                
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
                        const bookingDate = getUKStoredAsLocalDate(booking.date_time);
                        const dueDate = bookingDate ? new Date(bookingDate) : null;
                        if (dueDate) dueDate.setDate(dueDate.getDate() + 8);
                        const daysOverdue = dueDate ? Math.floor((getUKNowAsLocalDate().getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
                        
                        return (
                          <div key={booking.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-white rounded border border-red-200">
                            <div className="space-y-1">
                              <p className="font-medium text-gray-900">
                                {formatUKLocaleDate(booking.date_time, undefined, 'en-GB')} - {booking.address}
                              </p>
                              <p className="text-sm text-gray-600">
                                Amount: £{parseFloat(String(booking.total_cost ?? '0')).toFixed(2)} • {daysOverdue} days overdue
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
                                            {formatUKLocaleDate(booking.date_time, undefined, 'en-GB')} • {booking.address}
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
                                            {formatUKLocaleDate(order.date_time, undefined, 'en-GB')} • {order.address}
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
    </ShellPage>
  );
};

export default CustomerDashboard;
