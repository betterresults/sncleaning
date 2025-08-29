import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertTriangle, DollarSign } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AdjustPaymentAmountDialogProps {
  booking: {
    id: number;
    total_cost: number;
    payment_status: string;
    first_name: string;
    last_name: string;
    invoice_id?: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdjustPaymentAmountDialog: React.FC<AdjustPaymentAmountDialogProps> = ({
  booking,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [newAmount, setNewAmount] = useState(booking?.total_cost?.toString() || '0');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const difference = parseFloat(newAmount) - (booking?.total_cost || 0);
  const isIncrease = difference > 0;
  const isDecrease = difference < 0;

  // Don't render dialog if booking is null
  if (!booking) {
    return null;
  }

  const handleAdjustPayment = async () => {
    if (!newAmount || parseFloat(newAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive",
      });
      return;
    }

    if (parseFloat(newAmount) === (booking.total_cost || 0)) {
      toast({
        title: "No Change",
        description: "The new amount is the same as the current amount",
        variant: "destructive",
      });
      return;
    }

    if (!reason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for the payment adjustment",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('stripe-adjust-payment-amount', {
        body: {
          bookingId: booking.id,
          newAmount: parseFloat(newAmount),
          reason: reason.trim()
        }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to adjust payment amount');
      }

      toast({
        title: "Payment Adjusted Successfully",
        description: `Payment amount changed from £${booking.total_cost} to £${newAmount}`,
      });

      onSuccess();
      onClose();
      
      // Reset form
      setNewAmount(booking.total_cost?.toString() || '0');
      setReason('');

    } catch (error) {
      console.error('Error adjusting payment amount:', error);
      toast({
        title: "Adjustment Failed",
        description: error.message || "Failed to adjust payment amount",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      setNewAmount(booking.total_cost?.toString() || '0');
      setReason('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Adjust Payment Amount
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">Customer</p>
            <p className="font-medium">{booking.first_name} {booking.last_name}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Current Amount: <span className="font-semibold">£{booking.total_cost || 0}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Status: <span className="font-semibold capitalize">{booking.payment_status}</span>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newAmount">New Amount (£)</Label>
            <Input
              id="newAmount"
              type="number"
              step="0.01"
              min="0.01"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              placeholder="Enter new amount"
              disabled={loading}
            />
          </div>

          {difference !== 0 && (
            <Alert className={isIncrease ? "border-orange-200 bg-orange-50" : "border-green-200 bg-green-50"}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This will {isIncrease ? 'increase' : 'decrease'} the payment by{' '}
                <span className="font-semibold">
                  £{Math.abs(difference).toFixed(2)}
                </span>
                {isIncrease && booking.payment_status === 'authorized' && (
                  <span className="block mt-1 text-sm">
                    The existing authorization will be canceled and a new one created for £{newAmount}
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Adjustment *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Additional cleaning required, Extra services added, Price correction..."
              rows={3}
              disabled={loading}
            />
          </div>

          {booking.payment_status === 'authorized' && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This booking has an authorized payment. The system will cancel the existing authorization 
                and create a new one for the adjusted amount.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleAdjustPayment} 
            disabled={loading || parseFloat(newAmount) === (booking.total_cost || 0)}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Adjust Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};