import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePaymentAdjustment } from "@/hooks/usePaymentAdjustment";

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
  const [currentlyAuthorized, setCurrentlyAuthorized] = useState<string>('');
  const [adjustmentAction, setAdjustmentAction] = useState<'adjust' | 'reauthorize'>('reauthorize');
  const { toast } = useToast();
  const { adjustPaymentAmount, loading: isLoading } = usePaymentAdjustment();

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

  // Only show for genuinely partial authorizations
  const hasRemainingAmount = (
    (hasPartialInfo && remainingAmount > 0) || 
    (booking.payment_status === 'partially_authorized') ||
    // Only show for 'authorized' status if we have clear evidence of partial authorization
    (booking.payment_status === 'authorized' && hasPartialInfo && remainingAmount > 0)
  );

  const handleAuthorizeRemaining = async () => {
    const { remainingAmount, totalAmount, authorizedAmount } = getAuthorizedAmounts();
    
    if (adjustmentAction === 'adjust' && remainingAmount <= 0) {
      toast({
        title: "No amount to authorize",
        description: "The booking is fully authorized",
        variant: "destructive",
      });
      return;
    }

    try {
      const reasonText = adjustmentAction === 'reauthorize'
        ? `Reauthorize booking - Cancel old authorization (£${authorizedAmount.toFixed(2)}) and create new (£${totalAmount.toFixed(2)})`
        : `Authorize additional amount of £${remainingAmount.toFixed(2)}`;

      await adjustPaymentAmount({
        bookingId: booking.id,
        newAmount: totalAmount,
        reason: reasonText,
        action: adjustmentAction
      });

      const successMessage = adjustmentAction === 'reauthorize'
        ? `Old authorization cancelled, new authorization created for £${totalAmount.toFixed(2)}`
        : `Authorized additional £${remainingAmount.toFixed(2)}`;

      toast({
        title: "Success",
        description: successMessage,
      });

      setIsOpen(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error adjusting payment:', error);
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Adjust Payment Authorization
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Booking Details</h3>
            <div className="text-sm space-y-1">
              <p><span className="text-muted-foreground">Customer:</span> {booking.first_name} {booking.last_name}</p>
              <p><span className="text-muted-foreground">Current Total:</span> £{totalAmount.toFixed(2)}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currentAuth">Currently Authorized Amount (£)</Label>
            <Input
              id="currentAuth"
              type="number"
              step="0.01"
              min="0"
              value={currentlyAuthorized}
              onChange={(e) => setCurrentlyAuthorized(e.target.value)}
              placeholder="Enter currently authorized amount"
            />
            <p className="text-xs text-muted-foreground">
              Check Stripe dashboard to verify the currently authorized amount
            </p>
          </div>

          {remainingAmount !== 0 && currentlyAuthorized && (
            <>
              <div className="space-y-3">
                <Label>Payment Adjustment Method</Label>
                <div className="space-y-2">
                  <div 
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      adjustmentAction === 'reauthorize' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setAdjustmentAction('reauthorize')}
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="radio"
                        checked={adjustmentAction === 'reauthorize'}
                        onChange={() => setAdjustmentAction('reauthorize')}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">Cancel & Reauthorize (Recommended)</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Cancel existing authorization and create new one for £{totalAmount.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div 
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      adjustmentAction === 'adjust' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setAdjustmentAction('adjust')}
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="radio"
                        checked={adjustmentAction === 'adjust'}
                        onChange={() => setAdjustmentAction('adjust')}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">Add Additional Authorization</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Keep existing authorization and add new one for difference (£{Math.abs(remainingAmount).toFixed(2)})
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Currently Authorized:</span>
                  <span className="font-medium">£{authorizedAmount.toFixed(2)}</span>
                </div>
                {adjustmentAction === 'reauthorize' ? (
                  <>
                    <div className="flex justify-between text-sm text-orange-600">
                      <span>Will Cancel:</span>
                      <span className="font-medium">-£{authorizedAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-600">
                      <span>New Authorization:</span>
                      <span className="font-medium">+£{totalAmount.toFixed(2)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {remainingAmount > 0 ? 'Additional to Authorize:' : 'Overauthorized by:'}
                    </span>
                    <span className={`font-medium ${remainingAmount > 0 ? 'text-primary' : 'text-orange-600'}`}>
                      £{Math.abs(remainingAmount).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-semibold pt-2 border-t">
                  <span>Final Total:</span>
                  <span>£{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </>
          )}

          {remainingAmount === 0 && currentlyAuthorized && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="text-sm text-green-800">
                ✓ This booking is fully authorized
              </p>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAuthorizeRemaining}
            disabled={isLoading || (adjustmentAction === 'adjust' && remainingAmount <= 0)}
          >
            {isLoading ? "Processing..." : 
              adjustmentAction === 'reauthorize' 
                ? `Reauthorize for £${totalAmount.toFixed(2)}`
                : `Authorize £${Math.abs(remainingAmount).toFixed(2)}`
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}