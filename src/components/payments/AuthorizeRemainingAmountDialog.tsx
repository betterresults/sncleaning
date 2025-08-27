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
  const [currentlyAuthorized, setCurrentlyAuthorized] = useState<string>('');
  const { toast } = useToast();

  // Calculate remaining amount from user input or additional_details
  const getAuthorizedAmounts = () => {
    const details = booking.additional_details || '';
    
    // Use user input if provided, otherwise try to parse from details
    let authorizedAmount = 0;
    
    if (currentlyAuthorized && !isNaN(parseFloat(currentlyAuthorized))) {
      authorizedAmount = parseFloat(currentlyAuthorized);
    } else {
      // Pattern 1: "Additional payment authorized: £X.XX"
      const additionalPaymentMatch = details.match(/Additional payment authorized: £([\d.]+)/);
      if (additionalPaymentMatch) {
        authorizedAmount = parseFloat(additionalPaymentMatch[1]);
      }
      
      // Pattern 2: "Partial authorization: £X.XX of £Y.YY"
      const partialAuthMatch = details.match(/Partial authorization: £([\d.]+) of £[\d.]+/);
      if (partialAuthMatch) {
        authorizedAmount = parseFloat(partialAuthMatch[1]);
      }
    }
    
    const remainingAmount = booking.total_cost - authorizedAmount;
    
    return {
      authorizedAmount,
      remainingAmount,
      totalAmount: booking.total_cost,
      hasPartialInfo: authorizedAmount > 0 || currentlyAuthorized !== ''
    };
  };

  const { authorizedAmount, remainingAmount, totalAmount, hasPartialInfo } = getAuthorizedAmounts();

  // Show if there's evidence of partial authorization OR if payment is authorized but we suspect it might be partial
  const hasRemainingAmount = (
    (hasPartialInfo && remainingAmount > 0) || 
    (booking.payment_status === 'partially_authorized') ||
    (booking.payment_status === 'authorized' && authorizedAmount === 0) // Show for manual check on any authorized amount
  );

  const handleAuthorizeRemaining = async () => {
    const amountToAuthorize = remainingAmount > 0 ? remainingAmount : totalAmount;
    
    if (amountToAuthorize <= 0) {
      toast({
        title: "Error",
        description: "No amount to authorize",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('Authorizing amount:', {
        bookingId: booking.id,
        amountToAuthorize,
        currentlyAuthorized: authorizedAmount,
        reason: `${hasPartialInfo ? 'Completing authorization' : 'Authorizing'}: Additional £${amountToAuthorize} ${hasPartialInfo ? `to reach full £${totalAmount}` : ''}`
      });

      const { data, error } = await supabase.functions.invoke('stripe-adjust-payment-amount', {
        body: {
          bookingId: booking.id,
          newAmount: hasPartialInfo ? totalAmount : amountToAuthorize, 
          reason: `${hasPartialInfo ? 'Completing authorization' : 'Authorizing'}: Additional £${amountToAuthorize} ${hasPartialInfo ? `to reach full £${totalAmount}` : ''}`
        }
      });

      if (error || !data?.success) {
        const errorMessage = data?.error || error?.message || 'Failed to authorize remaining amount';
        console.error('Authorization error:', { error, data });
        throw new Error(errorMessage);
      }

      toast({
        title: "Success",
        description: `Successfully authorized £${amountToAuthorize}${hasPartialInfo ? `. Total authorized: £${totalAmount}` : ''}`,
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
                <h4 className="font-medium text-orange-800">
                  {hasPartialInfo ? 'Partial Authorization Detected' : 'Check Authorization Amount'}
                </h4>
                <p className="text-sm text-orange-700 mt-1">
                  {hasPartialInfo 
                    ? 'This booking has only partial payment authorization. Complete the full authorization to process the booking.'
                    : 'Please verify if the full amount is authorized. If only partial, use this to authorize the remaining amount.'
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Authorization Details:</h4>
            <div className="bg-gray-50 p-3 rounded space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Customer:</span>
                <span className="font-medium">{booking.first_name} {booking.last_name}</span>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Currently Authorized Amount:</label>
                <div className="flex items-center space-x-2">
                  <span className="text-lg">£</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={totalAmount}
                    value={currentlyAuthorized}
                    onChange={(e) => setCurrentlyAuthorized(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter amount already authorized"
                  />
                </div>
                <p className="text-xs text-gray-500">Enter the amount you've verified is already authorized in Stripe</p>
              </div>
              
              <div className="flex justify-between">
                <span>Amount to Authorize:</span>
                <span className="text-orange-600 font-medium">
                  £{Math.max(0, remainingAmount).toFixed(2)}
                </span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between font-medium">
                <span>Total Amount:</span>
                <span>£{totalAmount.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
              <p className="text-blue-800 font-medium mb-1">💡 How to verify current authorization:</p>
              <p className="text-blue-700 text-xs">
                1. Check your Stripe Dashboard → Payments<br/>
                2. Search for customer "{booking.first_name} {booking.last_name}"<br/>
                3. Look for today's payment intent and note the authorized amount<br/>
                4. Enter that amount above, then authorize the remaining amount
              </p>
            </div>
          </div>

          <p className="text-sm text-gray-600">
            This will create an additional authorization for £{Math.max(0, remainingAmount).toFixed(2)}.
            {remainingAmount <= 0 && ' Note: No remaining amount to authorize based on your input.'}
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
              disabled={isLoading || remainingAmount <= 0}
              className="flex-1 gap-2"
            >
              <CreditCard className="h-4 w-4" />
              {isLoading ? 'Authorizing...' : `Authorize £${Math.max(0, remainingAmount).toFixed(2)}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}