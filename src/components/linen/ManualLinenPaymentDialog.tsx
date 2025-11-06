import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, DollarSign, Clock, Zap, RotateCcw, Mail, Link } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { playSuccessSound } from '@/utils/soundEffects';

interface PaymentMethod {
  id: string;
  stripe_payment_method_id: string;
  card_brand: string;
  card_last4: string;
  card_exp_month: number;
  card_exp_year: number;
  is_default: boolean;
}

interface LinenOrder {
  id: string;
  customer_id: number;
  total_cost: number;
  payment_status: string;
  delivery_date?: string;
  customers: {
    first_name: string;
    last_name: string;
    email: string;
  };
  addresses: {
    address: string;
    postcode: string;
  };
}

interface ManualLinenPaymentDialogProps {
  order: LinenOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ManualLinenPaymentDialog = ({ order, isOpen, onClose, onSuccess }: ManualLinenPaymentDialogProps) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'existing' | 'payment_link'>('existing');
  const [paymentLinkDescription, setPaymentLinkDescription] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (order) {
      setAmount(order.total_cost || 0);
      const deliveryDate = order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('en-GB') : 'TBC';
      setPaymentLinkDescription(`Linen Service - ${deliveryDate} - ${order.addresses.address}`);
      fetchPaymentMethods();
    }
  }, [order]);

  const fetchPaymentMethods = async () => {
    if (!order) return;

    try {
      const { data, error } = await supabase
        .from('customer_payment_methods')
        .select('*')
        .eq('customer_id', order.customer_id);

      if (error) throw error;

      setPaymentMethods(data || []);
      
      // Set default payment method as selected and mode
      const defaultPM = data?.find(pm => pm.is_default);
      if (defaultPM) {
        setSelectedPaymentMethod(defaultPM.stripe_payment_method_id);
        setPaymentMode('existing');
      } else if (data && data.length > 0) {
        setSelectedPaymentMethod(data[0].stripe_payment_method_id);
        setPaymentMode('existing');
      } else {
        setPaymentMode('payment_link');
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payment methods',
        variant: 'destructive',
      });
    }
  };

  const handleSendPaymentLink = async () => {
    if (!order) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-send-payment-link', {
        body: {
          customer_id: order.customer_id,
          amount: amount * 100, // Convert to cents
          description: paymentLinkDescription,
          customer_email: order.customers.email,
          customer_name: `${order.customers.first_name} ${order.customers.last_name}`,
          metadata: {
            type: 'linen_order',
            order_id: order.id
          }
        }
      });

      if (error) throw error;

      // Update order payment status to pending
      const { error: updateError } = await supabase
        .from('linen_orders')
        .update({ 
          payment_status: 'pending',
          payment_method: 'stripe'
        })
        .eq('id', order.id);

      if (updateError) throw updateError;

      toast({
        title: 'Payment Link Sent',
        description: `Payment link sent to ${order.customers.email}`,
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Send payment link error:', error);
      toast({
        title: 'Failed to Send Link',
        description: error.message || 'Failed to send payment link',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDirectCharge = async () => {
    if (!order || !selectedPaymentMethod) return;

    setLoading(true);
    try {
      // Create a direct Stripe payment intent for linen order
      const { data, error } = await supabase.functions.invoke('stripe-capture-payment', {
        body: {
          customer_id: order.customer_id,
          payment_method_id: selectedPaymentMethod,
          amount: Math.round(amount * 100), // Convert to cents
          description: paymentLinkDescription,
          metadata: {
            type: 'linen_order',
            order_id: order.id,
            customer_email: order.customers.email
          },
          // Use new direct payment format
          payment_items: [{
            type: 'linen_order',
            id: order.id,
            amount: Math.round(amount * 100),
            description: paymentLinkDescription
          }]
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.message || 'Payment failed');

      // Update the order payment status
      const { error: updateError } = await supabase
        .from('linen_orders')
        .update({ 
          payment_status: 'paid',
          payment_method: 'stripe'
        })
        .eq('id', order.id);

      if (updateError) throw updateError;

      playSuccessSound();
      toast({
        title: 'Payment Successful',
        description: 'Customer has been charged successfully',
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Direct charge error:', error);
      
      // Extract specific error details from Stripe
      let errorMessage = "Failed to charge customer. Please try again.";
      let errorDetails = "";
      
      if (error?.message) {
        errorMessage = error.message;
      }
      
      // Check for specific decline reasons
      if (error?.decline_code) {
        const declineReasons: { [key: string]: string } = {
          'insufficient_funds': 'Card has insufficient funds',
          'card_declined': 'Card was declined by the bank',
          'expired_card': 'Card has expired',
          'incorrect_cvc': 'Incorrect security code',
          'processing_error': 'Processing error occurred',
          'lost_card': 'Card reported as lost',
          'stolen_card': 'Card reported as stolen',
          'generic_decline': 'Card was declined'
        };
        
        errorDetails = declineReasons[error.decline_code] || `Decline code: ${error.decline_code}`;
      }
      
      // Show network decline codes if available
      if (error?.network_decline_code) {
        errorDetails += ` (Network code: ${error.network_decline_code})`;
      }
      
      toast({
        title: "Payment Failed",
        description: (
          <div className="space-y-1">
            <p className="font-medium">{errorMessage}</p>
            {errorDetails && <p className="text-sm">Reason: {errorDetails}</p>}
            <p className="text-xs opacity-70">Try using a different payment method or contact the customer's bank.</p>
          </div>
        ),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-blue-100 text-blue-800">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case 'unpaid':
        return <Badge className="bg-yellow-100 text-yellow-800">Unpaid</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  if (!order) return null;

  const hasPaymentMethods = paymentMethods.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Linen Order Payment Management
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Info */}
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Customer:</span>
                  <br />
                  {order.customers.first_name} {order.customers.last_name}
                  <br />
                  {order.customers.email}
                </div>
                <div>
                  <span className="font-medium">Order Total:</span>
                  <br />
                  £{order.total_cost.toFixed(2)}
                  <br />
                  Status: {getPaymentStatusBadge(order.payment_status)}
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs value={paymentMode} onValueChange={(value) => setPaymentMode(value as any)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="existing" disabled={!hasPaymentMethods}>
                <CreditCard className="h-4 w-4 mr-2" />
                Charge Existing Card {!hasPaymentMethods && '(None)'}
              </TabsTrigger>
              <TabsTrigger value="payment_link">
                <Link className="h-4 w-4 mr-2" />
                Send Payment Link
              </TabsTrigger>
            </TabsList>

            <TabsContent value="existing" className="space-y-4">
              {hasPaymentMethods ? (
                <>
                  <div>
                    <Label>Payment Method</Label>
                    <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map((pm) => (
                          <SelectItem key={pm.id} value={pm.stripe_payment_method_id}>
                            {pm.card_brand.toUpperCase()} •••• {pm.card_last4}
                            {pm.is_default && ' (Default)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Amount to Charge</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={amount}
                      onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <Button 
                    onClick={handleDirectCharge} 
                    disabled={loading || !selectedPaymentMethod}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Charge £{amount.toFixed(2)} Now
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No payment methods on file</p>
                  <p className="text-sm">Use the payment link option instead</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="payment_link" className="space-y-4">
              <div>
                <Label>Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={paymentLinkDescription}
                  onChange={(e) => setPaymentLinkDescription(e.target.value)}
                  placeholder="Payment description for the customer"
                  rows={2}
                />
              </div>

              <Button 
                onClick={handleSendPaymentLink} 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Payment Link (£{amount.toFixed(2)})
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManualLinenPaymentDialog;