import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Booking {
  id: number;
  total_cost: number;
  payment_status: string;
  additional_details?: string;
  first_name?: string;
  last_name?: string;
}

interface AuthorizeRemainingAmountDialogProps {
  booking: Booking;
  onSuccess?: () => void;
}

export function AuthorizeRemainingAmountDialog({ booking, onSuccess }: AuthorizeRemainingAmountDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Calculate remaining amount from additional_details
  const getAuthorizedAmounts = () => {
    const details = booking.additional_details || '';
    const matches = details.match(/Additional payment authorized: £([\d.]+)/);
    const authorizedAmount = matches ? parseFloat(matches[1]) : 0;
    const remainingAmount = booking.total_cost - authorizedAmount;
    
    return {
      authorizedAmount,
      remainingAmount,
      totalAmount: booking.total_cost
    };
  };

  const { authorizedAmount, remainingAmount, totalAmount } = getAuthorizedAmounts();

  // Only show if there's a remaining amount to authorize
  const hasRemainingAmount = remainingAmount > 0 && booking.payment_status === 'partially_authorized';

  const handleAuthorizeRemaining = async () => {
    if (remainingAmount <= 0) {
      toast({
        title: "Error",
        description: "No remaining amount to authorize",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('Authorizing remaining amount:', {
        bookingId: booking.id,
        remainingAmount,
        reason: `Completing authorization: Additional £${remainingAmount} to reach full £${totalAmount}`
      });

      const { data, error } = await supabase.functions.invoke('stripe-adjust-payment-amount', {
        body: {
          bookingId: booking.id,
          newAmount: totalAmount, // This will create authorization for remaining amount
          reason: `Completing authorization: Additional £${remainingAmount} to reach full £${totalAmount}`
        }
      });

      if (error || !data?.success) {
        const errorMessage = data?.error || error?.message || 'Failed to authorize remaining amount';
        console.error('Authorization error:', { error, data });
        throw new Error(errorMessage);
      }

      toast({
        title: "Success",
        description: `Successfully authorized remaining £${remainingAmount}. Total authorized: £${totalAmount}`,
      });

      setIsOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error authorizing remaining amount:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to authorize remaining amount',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasRemainingAmount) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          Authorize Remaining £{remainingAmount.toFixed(2)}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Authorize Remaining Amount
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-orange-800">Partial Authorization Detected</h4>
                <p className="text-sm text-orange-700 mt-1">
                  This booking has only partial payment authorization. Complete the full authorization to process the booking.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Authorization Details:</h4>
            <div className="bg-gray-50 p-3 rounded space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Customer:</span>
                <span className="font-medium">{booking.first_name} {booking.last_name}</span>
              </div>
              <div className="flex justify-between">
                <span>Currently Authorized:</span>
                <span className="text-green-600 font-medium">£{authorizedAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Remaining to Authorize:</span>
                <span className="text-orange-600 font-medium">£{remainingAmount.toFixed(2)}</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between font-medium">
                <span>Total Amount:</span>
                <span>£{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-600">
            This will create an additional authorization for £{remainingAmount.toFixed(2)} to complete the full payment authorization.
          </p>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAuthorizeRemaining}
              disabled={isLoading}
              className="flex-1 gap-2"
            >
              <CreditCard className="h-4 w-4" />
              {isLoading ? 'Authorizing...' : `Authorize £${remainingAmount.toFixed(2)}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}