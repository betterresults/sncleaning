import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Loader2, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { playSuccessSound } from '@/utils/soundEffects';

interface UnpaidBooking {
  id: string;
  date_time: string;
  address: string;
  postcode: string;
  total_cost: number;
  cleaning_type: string;
  payment_status: string;
  source: 'past_booking' | 'linen_order';
}

interface PaymentMethod {
  id: string;
  stripe_payment_method_id: string;
  card_brand: string;
  card_last4: string;
  card_exp_month: number;
  card_exp_year: number;
  is_default: boolean;
}

interface CustomerDirectPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: number;
  customerName: string;
  customerEmail: string;
  onPaymentSuccess: () => void;
}

const CustomerDirectPaymentDialog = ({ 
  open, 
  onOpenChange, 
  customerId, 
  customerName, 
  customerEmail,
  onPaymentSuccess
}: CustomerDirectPaymentDialogProps) => {
  const [unpaidBookings, setUnpaidBookings] = useState<UnpaidBooking[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && customerId) {
      fetchData();
    }
  }, [open, customerId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch payment methods
      const { data: paymentMethodsData, error: pmError } = await supabase
        .from('customer_payment_methods')
        .select('*')
        .eq('customer_id', customerId);

      if (pmError) throw pmError;
      setPaymentMethods(paymentMethodsData || []);

      // Fetch unpaid bookings
      const [pastBookingsResponse, linenOrdersResponse] = await Promise.all([
        // Past bookings (completed cleanings that haven't been paid)
        supabase
          .from('past_bookings')
          .select('id, date_time, address, postcode, total_cost, cleaning_type, payment_status')
          .eq('customer', customerId)
          .or('payment_status.ilike.%unpaid%,payment_status.ilike.%collecting%,payment_status.ilike.%outstanding%,payment_status.ilike.%pending%,payment_status.is.null')
          .order('date_time', { ascending: false }),
        
        // Unpaid linen orders  
        supabase
          .from('linen_orders')
          .select('id, order_date, total_cost, payment_status, address_id')
          .eq('customer_id', customerId)
          .neq('payment_status', 'paid')
          .order('order_date', { ascending: false })
      ]);

      const pastBookings = pastBookingsResponse.data || [];
      const linenOrders = linenOrdersResponse.data || [];

      // Get addresses for linen orders
      const addressIds = linenOrders.map(order => order.address_id).filter(Boolean);
      let addresses = [];
      
      if (addressIds.length > 0) {
        const { data: addressesData } = await supabase
          .from('addresses')
          .select('id, address, postcode')
          .in('id', addressIds);
        addresses = addressesData || [];
      }

      // Create address lookup
      const addressLookup = addresses.reduce((acc, addr) => {
        acc[addr.id] = addr;
        return acc;
      }, {} as Record<string, any>);

      // Combine bookings and linen orders
      const allUnpaidItems = [
        ...pastBookings.map(booking => ({
          id: booking.id.toString(),
          date_time: booking.date_time,
          address: booking.address || 'No address',
          postcode: booking.postcode || '',
          total_cost: parseFloat(booking.total_cost?.toString() || '0'),
          cleaning_type: booking.cleaning_type || 'Cleaning Service',
          payment_status: booking.payment_status || 'unpaid',
          source: 'past_booking' as const
        })),
        ...linenOrders.map(order => {
          const address = addressLookup[order.address_id];
          return {
            id: order.id,
            date_time: order.order_date,
            address: address?.address || 'Linen Order',
            postcode: address?.postcode || '',
            total_cost: parseFloat(order.total_cost?.toString() || '0'),
            cleaning_type: 'Linen Service',
            payment_status: order.payment_status || 'unpaid',
            source: 'linen_order' as const
          };
        })
      ];

      setUnpaidBookings(allUnpaidItems);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payment data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayAllBookings = async () => {
    if (unpaidBookings.length === 0) {
      toast({
        title: 'No Unpaid Bookings',
        description: 'There are no unpaid bookings to process.',
      });
      return;
    }

    if (paymentMethods.length === 0) {
      toast({
        title: 'No Payment Method',
        description: 'Please add a payment method first.',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);
    try {
      // Get default payment method or first one
      const defaultMethod = paymentMethods.find(pm => pm.is_default) || paymentMethods[0];
      
      // Calculate total amount
      const totalAmount = unpaidBookings.reduce((sum, booking) => sum + booking.total_cost, 0);

      // Process payment using stripe-process-payments or create a new edge function
      const { data, error } = await supabase.functions.invoke('stripe-capture-payment', {
        body: {
          customer_id: customerId,
          payment_method_id: defaultMethod.stripe_payment_method_id,
          amount: Math.round(totalAmount * 100), // Convert to cents
          description: `Payment for ${unpaidBookings.length} booking(s) - ${customerName}`,
          booking_ids: unpaidBookings.filter(b => b.source === 'past_booking').map(b => parseInt(b.id)),
          linen_order_ids: unpaidBookings.filter(b => b.source === 'linen_order').map(b => b.id)
        }
      });

      if (error) throw error;

      if (data.success) {
        playSuccessSound();
        toast({
          title: 'Payment Successful! 🎉',
          description: `Successfully charged £${totalAmount.toFixed(2)} for ${unpaidBookings.length} booking(s). All bookings have been marked as paid.`,
        });

        onPaymentSuccess();
        onOpenChange(false);
      } else {
        throw new Error(data.error || 'Payment failed');
      }

    } catch (error: any) {
      console.error('Error processing payment:', error);
      toast({
        title: 'Payment Failed',
        description: error.message || 'Failed to process payment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const totalAmount = unpaidBookings.reduce((sum, booking) => sum + booking.total_cost, 0);
  const defaultPaymentMethod = paymentMethods.find(pm => pm.is_default) || paymentMethods[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#185166]">
            <CreditCard className="h-5 w-5" />
            Direct Payment - {customerName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
              <p className="mt-2 text-muted-foreground">Loading payment data...</p>
            </div>
          ) : (
            <>
              {/* Payment Method Info */}
              {paymentMethods.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Payment Method Available</span>
                  </div>
                  <p className="text-green-700 mt-1">
                    {defaultPaymentMethod?.card_brand.toUpperCase()} •••• {defaultPaymentMethod?.card_last4}
                    {defaultPaymentMethod?.is_default && ' (Default)'}
                  </p>
                </div>
              )}

              {paymentMethods.length === 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">No Payment Method</span>
                  </div>
                  <p className="text-red-700 mt-1">
                    This customer needs to add a payment method before making payments.
                  </p>
                </div>
              )}

              {/* Unpaid Bookings */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-[#185166]">
                  Unpaid Bookings ({unpaidBookings.length})
                </h3>

                {unpaidBookings.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-3" />
                    <p className="font-medium text-gray-900">All bookings are paid!</p>
                    <p className="text-sm text-gray-500">
                      This customer has no outstanding payments.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {unpaidBookings.map((booking) => (
                      <Card key={`${booking.source}-${booking.id}`} className="border-orange-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                <span className="font-medium">
                                  {new Date(booking.date_time).toLocaleDateString()}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {booking.source === 'past_booking' ? 'Cleaning' : 'Linen'}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {booking.cleaning_type} - {booking.address}
                              </p>
                              <p className="text-xs text-gray-500">
                                Status: {booking.payment_status}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-[#185166]">
                                £{booking.total_cost.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Total and Pay Button */}
              {unpaidBookings.length > 0 && (
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between text-lg font-semibold mb-4">
                    <span>Total Amount:</span>
                    <span className="text-[#185166]">£{totalAmount.toFixed(2)}</span>
                  </div>

                  <Button
                    onClick={handlePayAllBookings}
                    disabled={processing || paymentMethods.length === 0}
                    className="w-full bg-[#18A5A5] hover:bg-[#185166] text-white h-12"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Processing Payment...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Charge £{totalAmount.toFixed(2)} Now
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Close Button */}
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full"
                disabled={processing}
              >
                {processing ? 'Please wait...' : 'Close'}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerDirectPaymentDialog;