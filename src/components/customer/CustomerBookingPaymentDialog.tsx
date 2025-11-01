import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Calendar, MapPin, Clock, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PaymentMethod {
  id: string;
  stripe_payment_method_id: string;
  card_brand: string;
  card_last4: string;
  card_exp_month: number;
  card_exp_year: number;
  is_default: boolean;
}

interface Booking {
  id: number;
  service_type: string;
  address: string;
  date_time: string;
  total_hours: number;
  total_cost: number;
  payment_status: string;
  customer: number;
}

interface CustomerPaymentDialogProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CustomerPaymentDialog = ({ booking, isOpen, onClose, onSuccess }: CustomerPaymentDialogProps) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [isBusinessClient, setIsBusinessClient] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (booking && isOpen) {
      fetchPaymentMethods();
      checkIfBusinessClient();
    }
  }, [booking, isOpen]);

  const fetchPaymentMethods = async () => {
    if (!booking) return;

    try {
      const { data, error } = await supabase
        .from('customer_payment_methods')
        .select('*')
        .eq('customer_id', booking.customer);

      if (error) throw error;
      setPaymentMethods(data || []);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }
  };

  const checkIfBusinessClient = async () => {
    if (!booking) return;

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('clent_type')
        .eq('id', booking.customer)
        .single();

      if (error) throw error;
      // If customer type is business, they are a business client
      setIsBusinessClient(data?.clent_type === 'business');
    } catch (error) {
      console.error('Error checking customer type:', error);
    }
  };

  const handlePayNow = async (paymentMethodId?: string) => {
    if (!booking) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manual-payment-action', {
        body: {
          bookingId: booking.id,
          action: 'charge',
          amount: booking.total_cost,
          paymentMethodId
        }
      });

      if (error) throw error;

      toast({
        title: 'Payment Successful',
        description: 'Your payment has been processed successfully.',
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: 'Payment Failed',
        description: error.message || 'Failed to process payment',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddPaymentMethod = async () => {
    if (!booking) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-collect-payment-method', {
        body: {
          customer_id: booking.customer,
          return_url: `${window.location.origin}/customer-completed-bookings`
        }
      });

      if (error) throw error;

      if (data.checkout_url) {
        window.open(data.checkout_url, '_blank');
        toast({
          title: 'Add Payment Method',
          description: 'You will be redirected to securely add your payment method.',
        });
        onClose();
      }
    } catch (error: any) {
      console.error('Error adding payment method:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add payment method',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'authorized':
        return <Badge className="bg-blue-100 text-blue-800">Authorized</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case 'unpaid':
      case 'not paid':
        return <Badge className="bg-yellow-100 text-yellow-800">Unpaid</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  if (!booking) return null;

  const hasPaymentMethods = paymentMethods.length > 0;
  const isPaid = booking.payment_status?.toLowerCase().includes('paid');
  const defaultPaymentMethod = paymentMethods.find(pm => pm.is_default) || paymentMethods[0];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#185166]">
            <CreditCard className="h-5 w-5" />
            Payment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Booking Details */}
          <Card className="border-[#18A5A5]/20">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-[#185166]">{booking.service_type}</h3>
                <span className="text-lg font-bold text-[#18A5A5]">£{Number(booking.total_cost || 0).toFixed(2)}</span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{booking.address}</span>
                </div>
                
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(booking.date_time).toLocaleDateString('en-GB', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}</span>
                </div>
                
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{booking.total_hours} hours</span>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Payment Status:</span>
                {getPaymentStatusBadge(booking.payment_status)}
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          {!isPaid && !isBusinessClient && (
            <div className="space-y-3">
              {!hasPaymentMethods ? (
                <div className="text-center py-6 space-y-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <CreditCard className="h-16 w-16 mx-auto text-yellow-600" />
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-yellow-800">Payment Method Required</h3>
                    <p className="font-medium text-yellow-700">
                      Please add a payment card to pay for your booking
                    </p>
                    <p className="text-sm text-yellow-600">
                      You need to securely add your payment card details before you can complete this payment.
                    </p>
                  </div>
                  <Button
                    onClick={handleAddPaymentMethod}
                    disabled={loading}
                    className="bg-[#18A5A5] hover:bg-[#185166] text-white px-6 py-2"
                    size="lg"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {loading ? 'Setting up...' : 'Add Payment Card Now'}
                  </Button>
                  <p className="text-xs text-yellow-600">
                    🔒 Your payment information is securely encrypted and processed by Stripe
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <h4 className="font-medium text-[#185166]">Payment Methods</h4>
                  
                  {/* Default Payment Method */}
                  {defaultPaymentMethod && (
                    <Card className="border-[#18A5A5]/20 bg-[#18A5A5]/5">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CreditCard className="h-5 w-5 text-[#18A5A5]" />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium capitalize text-[#185166]">
                                  {defaultPaymentMethod.card_brand} •••• {defaultPaymentMethod.card_last4}
                                </span>
                                {defaultPaymentMethod.is_default && (
                                  <Badge variant="outline" className="text-xs border-[#18A5A5] text-[#18A5A5]">
                                    Default
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-500">
                                Expires {defaultPaymentMethod.card_exp_month.toString().padStart(2, '0')}/{defaultPaymentMethod.card_exp_year}
                              </p>
                            </div>
                          </div>
                          <Button
                            onClick={() => handlePayNow(defaultPaymentMethod.stripe_payment_method_id)}
                            disabled={loading}
                            size="sm"
                            className="bg-[#18A5A5] hover:bg-[#185166] text-white"
                          >
                            {loading ? 'Processing...' : 'Pay Now'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Add New Payment Method Option */}
                  <Button
                    variant="outline"
                    onClick={handleAddPaymentMethod}
                    disabled={loading}
                    className="w-full border-[#18A5A5] text-[#18A5A5] hover:bg-[#18A5A5] hover:text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Payment Method
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Cancel Button */}
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerPaymentDialog;