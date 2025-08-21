import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CreditCard, DollarSign, Clock, Zap, RotateCcw } from 'lucide-react';
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
  const [action, setAction] = useState<'authorize' | 'charge'>('charge');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (booking) {
      setAmount(booking.total_cost || 0);
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
      
      // Set default payment method as selected
      const defaultPM = data?.find(pm => pm.is_default);
      if (defaultPM) {
        setSelectedPaymentMethod(defaultPM.stripe_payment_method_id);
      } else if (data && data.length > 0) {
        setSelectedPaymentMethod(data[0].stripe_payment_method_id);
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

  if (!booking) return null;

  const hasPaymentMethods = paymentMethods.length > 0;
  const isFailedPayment = booking.payment_status?.toLowerCase() === 'failed';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Manual Payment Management
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Booking Info */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>Customer:</strong> {booking.first_name} {booking.last_name}</p>
                  <p><strong>Email:</strong> {booking.email}</p>
                  <p><strong>Date:</strong> {new Date(booking.date_time).toLocaleDateString()}</p>
                </div>
                <div>
                  <p><strong>Address:</strong> {booking.address}</p>
                  <p><strong>Total Cost:</strong> £{booking.total_cost}</p>
                  <p><strong>Payment Status:</strong> {getPaymentStatusBadge(booking.payment_status)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {!hasPaymentMethods ? (
            <Card>
              <CardContent className="p-4 text-center">
                <CreditCard className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-600">No payment methods available for this customer.</p>
                <p className="text-sm text-gray-500 mt-1">
                  Customer needs to add a payment method first.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Payment Method Selection */}
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((pm) => (
                      <SelectItem key={pm.id} value={pm.stripe_payment_method_id}>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          <span className="capitalize">{pm.card_brand}</span>
                          <span>•••• {pm.card_last4}</span>
                          <span className="text-sm text-gray-500">
                            {pm.card_exp_month.toString().padStart(2, '0')}/{pm.card_exp_year}
                          </span>
                          {pm.is_default && (
                            <Badge variant="outline" className="text-xs">Default</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label>Amount (£)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                />
              </div>

              {/* Action Selection */}
              <div className="space-y-2">
                <Label>Action</Label>
                <Select value={action} onValueChange={(value: 'authorize' | 'charge') => setAction(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="authorize">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <div>
                          <div>Authorize (Hold)</div>
                          <div className="text-xs text-gray-500">Put money on hold without charging</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="charge">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        <div>
                          <div>Charge Now</div>
                          <div className="text-xs text-gray-500">Charge immediately</div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Action Buttons */}
              <div className="flex gap-3">
                {isFailedPayment && (
                  <Button
                    onClick={handleRetryPayment}
                    disabled={loading}
                    className="flex items-center gap-2 flex-1"
                    variant="outline"
                  >
                    <RotateCcw className="h-4 w-4" />
                    {loading ? 'Retrying...' : 'Retry Payment'}
                  </Button>
                )}

                <Button
                  onClick={handlePaymentAction}
                  disabled={loading || !selectedPaymentMethod}
                  className="flex items-center gap-2 flex-1"
                >
                  {action === 'authorize' ? <Clock className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
                  {loading 
                    ? (action === 'authorize' ? 'Authorizing...' : 'Charging...')
                    : (action === 'authorize' ? `Authorize £${amount}` : `Charge £${amount}`)
                  }
                </Button>

                <Button variant="outline" onClick={onClose} disabled={loading}>
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManualPaymentDialog;