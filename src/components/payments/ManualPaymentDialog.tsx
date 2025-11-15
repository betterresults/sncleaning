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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CreditCard, DollarSign, Clock, Zap, RotateCcw, Mail, Link } from 'lucide-react';
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
  first_name: string;
  last_name: string;
  email: string;
  total_cost: number;
  payment_status: string;
  customer: number;
  date_time: string;
  address: string;
}

interface ManualPaymentDialogProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ManualPaymentDialog = ({ booking, isOpen, onClose, onSuccess }: ManualPaymentDialogProps) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [action, setAction] = useState<'authorize' | 'charge'>('authorize');
  const [loading, setLoading] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'existing' | 'collect_only' | 'payment_link'>('existing');
  const [paymentLinkDescription, setPaymentLinkDescription] = useState('');
  const [collectForFuture, setCollectForFuture] = useState(true);
  const [newPaymentStatus, setNewPaymentStatus] = useState<string>('');
  const [statusPopoverOpen, setStatusPopoverOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (booking) {
      setAmount(booking.total_cost || 0);
      setNewPaymentStatus(booking.payment_status || '');
      const cleaningDate = new Date(booking.date_time).toLocaleDateString('en-GB');
      setPaymentLinkDescription(`Cleaning Service - ${cleaningDate} - ${booking.address}`);
      fetchPaymentMethods();
    }
  }, [booking]);

  const fetchPaymentMethods = async () => {
    if (!booking) return;

    try {
      const { data, error } = await supabase
        .from('customer_payment_methods')
        .select('*')
        .eq('customer_id', booking.customer);

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
        setPaymentMode('collect_only');
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

  const handleCollectPaymentMethod = async () => {
    if (!booking) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-collect-payment-method', {
        body: {
          customer_id: booking.customer,
          email: booking.email,
          name: `${booking.first_name} ${booking.last_name}`.trim(),
          return_url: `https://account.sncleaningservices.co.uk/payment-method-success`
        }
      });

      if (error) throw error;

      if (data.checkout_url) {
        toast({
          title: 'Email Sent Successfully',
          description: `Payment method collection link sent to ${booking.email}. Customer can securely add their card details.`,
        });
        onClose();
      }
    } catch (error: any) {
      console.error('Error collecting payment method:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create payment method collection',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendPaymentLink = async () => {
    if (!booking || !amount || amount <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-send-payment-link', {
        body: {
          customer_id: booking.customer,
          email: booking.email,
          name: `${booking.first_name} ${booking.last_name}`.trim(),
          amount: amount,
          description: paymentLinkDescription,
          booking_id: booking.id,
          collect_payment_method: collectForFuture
        }
      });

      if (error) throw error;

      if (data.payment_link_url) {
        // Email the payment link to the customer instead of opening it here
        const { error: emailError } = await supabase.functions.invoke('send-notification-email', {
          body: {
            recipient_email: booking.email,
            recipient_name: `${booking.first_name} ${booking.last_name}`.trim(),
            custom_subject: `Cleaning Services Invoice - £${amount}`,
            custom_content: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; background-color: #fafafa; padding: 40px 20px;">
                <div style="background-color: white; border-radius: 8px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                  <div style="text-align: center; margin-bottom: 32px;">
                    <h1 style="color: hsl(180, 75%, 37%); margin: 0; font-size: 28px;">SN Cleaning Services</h1>
                  </div>
                  
                  <h2 style="color: hsl(196, 62%, 25%); font-size: 24px; margin-bottom: 16px;">Cleaning Services Invoice</h2>
                  
                  <p style="color: hsl(210, 20%, 15%); font-size: 16px; line-height: 1.6;">Dear ${booking.first_name},</p>
                  
                  <p style="color: hsl(210, 20%, 15%); font-size: 16px; line-height: 1.6;">Please complete your payment of <strong style="color: hsl(180, 75%, 37%);">£${amount}</strong> for the following service:</p>
                  
                  <div style="background-color: hsl(0, 0%, 96%); border-left: 4px solid hsl(180, 75%, 37%); padding: 16px; margin: 24px 0; border-radius: 4px;">
                    <p style="margin: 0; color: hsl(210, 20%, 15%); font-size: 15px;"><strong>Service:</strong> ${paymentLinkDescription}</p>
                  </div>
                  
                  ${collectForFuture ? `
                    <div style="background-color: hsl(180, 75%, 95%); border: 1px solid hsl(180, 75%, 37%); border-radius: 8px; padding: 20px; margin: 24px 0;">
                      <p style="margin: 0 0 12px 0; color: hsl(196, 62%, 25%); font-size: 15px; font-weight: 600;">✨ Automated Payment System</p>
                      <p style="margin: 0; color: hsl(210, 20%, 15%); font-size: 14px; line-height: 1.6;">We've upgraded to automated payments! Your card details will be securely saved. For future bookings, we'll place a hold on your card 24 hours before the service and charge it after the service is completed.</p>
                    </div>
                  ` : ''}
                  
                  <div style="text-align: center; margin: 32px 0;">
                    <a href="${data.payment_link_url}" style="background-color: hsl(180, 75%, 37%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px;">Complete Payment</a>
                  </div>
                  
                  <p style="color: hsl(210, 15%, 35%); font-size: 13px; text-align: center; margin: 20px 0;">Or copy and paste this link into your browser:</p>
                  <p style="word-break: break-all; background-color: hsl(0, 0%, 96%); padding: 12px; border-radius: 4px; font-size: 12px; color: hsl(210, 20%, 15%);">${data.payment_link_url}</p>
                  
                  <hr style="border: none; border-top: 1px solid hsl(0, 0%, 87%); margin: 32px 0;">
                  
                  <p style="color: hsl(210, 15%, 35%); font-size: 14px; line-height: 1.6;">If you have any questions, please don't hesitate to contact us.</p>
                  
                  <p style="color: hsl(210, 20%, 15%); font-size: 14px; margin-top: 24px;">Best regards,<br><strong style="color: hsl(180, 75%, 37%);">SN Cleaning Services Team</strong></p>
                </div>
                
                <p style="text-align: center; color: hsl(210, 15%, 35%); font-size: 12px; margin-top: 24px;">© 2024 SN Cleaning Services. All rights reserved.</p>
              </div>
            `
          }
        });

        if (emailError) throw emailError;

        toast({
          title: 'Payment Email Sent',
          description: `Service payment of £${amount} emailed to ${booking.email}${collectForFuture ? '. Automated payments enabled.' : ''}.`,
        });
        onClose();
      }
    } catch (error: any) {
      console.error('Error sending payment link:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create payment link',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  const handlePaymentAction = async () => {
    if (!booking || !selectedPaymentMethod) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manual-payment-action', {
        body: {
          bookingId: booking.id,
          action,
          amount,
          paymentMethodId: selectedPaymentMethod
        }
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Payment ${action === 'authorize' ? 'authorized' : 'charged'} successfully`,
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Payment action error:', error);
      toast({
        title: 'Payment Failed',
        description: error.message || `Failed to ${action} payment`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRetryPayment = async () => {
    if (!booking) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manual-payment-action', {
        body: {
          bookingId: booking.id,
          action: 'retry',
          amount,
          paymentMethodId: selectedPaymentMethod
        }
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Payment retry successful',
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Retry payment error:', error);
      toast({
        title: 'Retry Failed',
        description: error.message || 'Failed to retry payment',
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

  const handleQuickStatusUpdate = async (status: string) => {
    if (!booking || !status) return;

    setLoading(true);
    try {
      // Try updating bookings table first
      const { error: bookingsError } = await supabase
        .from('bookings')
        .update({ payment_status: status })
        .eq('id', booking.id);

      if (bookingsError) {
        // If not in bookings, try past_bookings
        const { error: pastBookingsError } = await supabase
          .from('past_bookings')
          .update({ payment_status: status })
          .eq('id', booking.id);

        if (pastBookingsError) throw pastBookingsError;
      }

      setNewPaymentStatus(status);
      setStatusPopoverOpen(false);

      toast({
        title: 'Success',
        description: 'Payment status updated successfully',
      });

      onSuccess();
    } catch (error: any) {
      console.error('Status update error:', error);
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update payment status',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800 hover:bg-green-200 border-green-200';
      case 'authorized':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200';
      case 'failed':
        return 'bg-red-100 text-red-800 hover:bg-red-200 border-red-200';
      case 'unpaid':
      case 'not paid':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200';
      case 'processing':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200';
    }
  };

  if (!booking) return null;

  const hasPaymentMethods = paymentMethods.length > 0;
  const isFailedPayment = booking.payment_status?.toLowerCase() === 'failed';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[100vw] max-h-[100vh] w-full h-full p-0 m-0 rounded-none">
        {/* Header with Back Button */}
        <div className="bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 p-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-xl"
            >
              ← Back
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{booking.first_name} {booking.last_name}</h2>
                <p className="text-sm text-white/80">{booking.email}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto h-[calc(100vh-120px)] space-y-4">
          {/* Booking Info with Status */}
          <Card className="rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-0">
            <CardContent className="p-4">
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-semibold">{new Date(booking.date_time).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Address</p>
                  <p className="font-semibold truncate">{booking.address}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-bold text-lg">£{Number(booking.total_cost || 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Status</p>
                  <Popover open={statusPopoverOpen} onOpenChange={setStatusPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline"
                        className={`w-full justify-start h-9 rounded-xl font-semibold border-2 ${getStatusColor(newPaymentStatus || booking.payment_status)}`}
                      >
                        {newPaymentStatus || booking.payment_status || 'Unknown'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-2" align="end">
                      <div className="space-y-1">
                        {['Paid', 'Unpaid', 'authorized', 'failed', 'Processing'].map((status) => (
                          <button
                            key={status}
                            onClick={() => handleQuickStatusUpdate(status)}
                            disabled={loading}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                              getStatusColor(status)
                            } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method Tabs - Visual */}
          <Card className="rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-0">
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-3 mb-4">
                {hasPaymentMethods && (
                  <button
                    onClick={() => setPaymentMode('existing')}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      paymentMode === 'existing' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <CreditCard className={`h-8 w-8 mx-auto mb-2 ${
                      paymentMode === 'existing' ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                    <p className="text-sm font-medium">Existing Card</p>
                  </button>
                )}
                <button
                  onClick={() => setPaymentMode('collect_only')}
                  className={`p-4 rounded-2xl border-2 transition-all ${
                    paymentMode === 'collect_only' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <CreditCard className={`h-8 w-8 mx-auto mb-2 ${
                    paymentMode === 'collect_only' ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                  <p className="text-sm font-medium">Collect Card</p>
                </button>
                <button
                  onClick={() => setPaymentMode('payment_link')}
                  className={`p-4 rounded-2xl border-2 transition-all ${
                    paymentMode === 'payment_link' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Link className={`h-8 w-8 mx-auto mb-2 ${
                    paymentMode === 'payment_link' ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                  <p className="text-sm font-medium">Payment Link</p>
                </button>
              </div>

              {/* Existing Payment Methods Content */}
              {hasPaymentMethods && paymentMode === 'existing' && (
                <div className="space-y-3">
                  <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select card" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((pm) => (
                        <SelectItem key={pm.id} value={pm.stripe_payment_method_id}>
                          <div className="flex items-center gap-2">
                            <span className="capitalize">{pm.card_brand}</span>
                            <span>•••• {pm.card_last4}</span>
                            {pm.is_default && (
                              <Badge variant="outline" className="text-xs">Default</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    onFocus={(e) => e.target.select()}
                    placeholder="Amount"
                    className="rounded-xl"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setAction('authorize')}
                      className={`p-3 rounded-xl border-2 transition-all text-left ${
                        action === 'authorize' 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Clock className={`h-5 w-5 mb-1 ${
                        action === 'authorize' ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                      <p className="text-sm font-medium">Hold</p>
                      <p className="text-xs text-muted-foreground">Authorize</p>
                    </button>
                    <button
                      onClick={() => setAction('charge')}
                      className={`p-3 rounded-xl border-2 transition-all text-left ${
                        action === 'charge' 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Zap className={`h-5 w-5 mb-1 ${
                        action === 'charge' ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                      <p className="text-sm font-medium">Charge</p>
                      <p className="text-xs text-muted-foreground">Immediate</p>
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handlePaymentAction}
                      disabled={loading || !selectedPaymentMethod}
                      className="flex-1 rounded-xl"
                    >
                      {loading ? 'Processing...' : action === 'authorize' ? 'Authorize' : 'Charge'}
                    </Button>
                    {isFailedPayment && (
                      <Button
                        onClick={handleRetryPayment}
                        disabled={loading || !selectedPaymentMethod}
                        variant="outline"
                        className="rounded-xl"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Collect Payment Method Content */}
              {paymentMode === 'collect_only' && (
                <div className="space-y-3">
                  <Button
                    onClick={handleCollectPaymentMethod}
                    disabled={loading}
                    className="w-full rounded-xl flex items-center justify-center gap-2"
                  >
                    <CreditCard className="h-4 w-4" />
                    {loading ? 'Creating...' : 'Collect Card Details'}
                  </Button>
                </div>
              )}

              {/* Payment Link Content */}
              {paymentMode === 'payment_link' && (
                <div className="space-y-3">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    onFocus={(e) => e.target.select()}
                    placeholder="Amount"
                    className="rounded-xl"
                  />

                  <Textarea
                    value={paymentLinkDescription}
                    onChange={(e) => setPaymentLinkDescription(e.target.value)}
                    placeholder="Description"
                    rows={2}
                    className="rounded-xl"
                  />

                  <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
                    <span className="text-sm">Save card for future</span>
                    <Switch
                      checked={collectForFuture}
                      onCheckedChange={setCollectForFuture}
                    />
                  </div>

                  <Button
                    onClick={handleSendPaymentLink}
                    disabled={loading || !amount}
                    className="w-full rounded-xl flex items-center justify-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    {loading ? 'Creating...' : 'Send Payment Link'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose} disabled={loading} className="rounded-xl">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManualPaymentDialog;