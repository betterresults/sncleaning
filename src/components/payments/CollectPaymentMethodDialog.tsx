import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Link, Mail } from 'lucide-react';

interface CollectPaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  booking?: {
    id: number;
    total_cost: number;
    cleaning_type: string;
    address: string;
  };
}

export const CollectPaymentMethodDialog: React.FC<CollectPaymentMethodDialogProps> = ({
  open,
  onOpenChange,
  customer,
  booking
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'collect_only' | 'payment_link'>('collect_only');
  const [amount, setAmount] = useState(booking?.total_cost?.toString() || '');
  const [description, setDescription] = useState(
    booking ? `${booking.cleaning_type} - ${booking.address}` : 'Cleaning Service Payment'
  );
  const [collectForFuture, setCollectForFuture] = useState(true);

  const handleCollectPaymentMethod = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-collect-payment-method', {
        body: {
          customer_id: customer.id,
          email: customer.email,
          name: `${customer.first_name} ${customer.last_name}`.trim(),
          return_url: `${window.location.origin}/payment-method-success`
        }
      });

      if (error) throw error;

      // Open Stripe checkout in new tab
      if (data.checkout_url) {
        window.open(data.checkout_url, '_blank');
        toast({
          title: 'Payment Method Collection Started',
          description: 'Customer will be redirected to securely add their payment method.',
        });
        onOpenChange(false);
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
    if (!amount || parseFloat(amount) <= 0) {
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
          customer_id: customer.id,
          email: customer.email,
          name: `${customer.first_name} ${customer.last_name}`.trim(),
          amount: parseFloat(amount),
          description,
          booking_id: booking?.id,
          collect_payment_method: collectForFuture
        }
      });

      if (error) throw error;

      // Open payment link in new tab
      if (data.payment_link_url) {
        window.open(data.payment_link_url, '_blank');
        
        // Also open setup session if collecting payment method
        if (collectForFuture && data.setup_session_url) {
          setTimeout(() => {
            window.open(data.setup_session_url, '_blank');
          }, 1000);
        }

        toast({
          title: 'Payment Link Created',
          description: `Payment link sent to ${customer.email}. Customer can pay £${amount}.`,
        });
        onOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Collect Payment Method
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm font-medium">{customer.first_name} {customer.last_name}</p>
            <p className="text-sm text-muted-foreground">{customer.email}</p>
          </div>

          <div className="flex space-x-2">
            <Button
              variant={mode === 'collect_only' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('collect_only')}
              className="flex-1"
            >
              <CreditCard className="h-4 w-4 mr-1" />
              Collect Card Only
            </Button>
            <Button
              variant={mode === 'payment_link' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('payment_link')}
              className="flex-1"
            >
              <Link className="h-4 w-4 mr-1" />
              Payment Link
            </Button>
          </div>

          {mode === 'payment_link' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (£)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Payment description"
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm">Also collect payment method for future use</Label>
                  <p className="text-xs text-muted-foreground">
                    Customer will also set up their card for future payments
                  </p>
                </div>
                <Switch
                  checked={collectForFuture}
                  onCheckedChange={setCollectForFuture}
                />
              </div>
            </>
          )}

          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={mode === 'collect_only' ? handleCollectPaymentMethod : handleSendPaymentLink}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                'Creating...'
              ) : mode === 'collect_only' ? (
                <>
                  <CreditCard className="h-4 w-4 mr-1" />
                  Collect Card
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-1" />
                  Send Payment Link
                </>
              )}
            </Button>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Payment method collection opens in a new tab</p>
            <p>• Customer enters card details securely via Stripe</p>
            <p>• Card is saved for future authorized payments</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};