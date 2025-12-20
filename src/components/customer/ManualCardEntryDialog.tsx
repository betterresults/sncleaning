import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CreditCard, Lock, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

// Initialize Stripe
const stripePromise = loadStripe('pk_live_51OZcDaGJOgpfVmv6XjBc9JQ85pD4f08dcRpQSYvMJUJpxMPGKwmKXOcjvlrNqJMKmLIyZ3bNjPLSxPVUOXCvAUZ500Q4jrOj66');

interface ManualCardEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: number;
  onSuccess: () => void;
}

interface CardFormProps {
  customerId: number;
  onSuccess: () => void;
  onCancel: () => void;
}

const CardForm: React.FC<CardFormProps> = ({ customerId, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const createSetupIntent = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('stripe-create-setup-intent', {
          body: { customer_id: customerId },
        });

        if (error) throw new Error(error.message);
        if (!data?.success) throw new Error(data?.error || 'Failed to initialize');

        setClientSecret(data.clientSecret);
        setStripeCustomerId(data.stripeCustomerId);
      } catch (err: any) {
        console.error('Error creating SetupIntent:', err);
        setInitError(err.message || 'Failed to initialize card form');
      }
    };

    createSetupIntent();
  }, [customerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !clientSecret || !stripeCustomerId) {
      toast({
        title: "Error",
        description: "Card form not ready. Please try again.",
        variant: "destructive",
      });
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      toast({
        title: "Error",
        description: "Card element not found",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Confirm the SetupIntent with Stripe.js
      const { setupIntent, error: confirmError } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (confirmError) {
        throw new Error(confirmError.message || 'Failed to save card');
      }

      if (!setupIntent?.payment_method) {
        throw new Error('No payment method created');
      }

      // Save the payment method to our database
      const { data: saveData, error: saveError } = await supabase.functions.invoke('stripe-save-payment-method', {
        body: {
          customer_id: customerId,
          payment_method_id: setupIntent.payment_method,
          stripe_customer_id: stripeCustomerId,
        },
      });

      if (saveError) throw new Error(saveError.message);
      if (!saveData?.success) throw new Error(saveData?.error || 'Failed to save card');

      toast({
        title: "Success",
        description: `Card ending in ${saveData.payment_method.card_last4} added successfully`,
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error adding card:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add card. Please check the details and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (initError) {
    return (
      <div className="text-center py-6">
        <p className="text-destructive mb-4">{initError}</p>
        <Button variant="outline" onClick={onCancel}>Close</Button>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="text-center py-6">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
        <p className="text-muted-foreground">Initializing secure card form...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Card Details</label>
        <div className="p-3 border rounded-md bg-background">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
        <Lock className="h-3 w-3" />
        <span>Card details are securely processed via Stripe</span>
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading || !stripe}
          className="flex-1 bg-[#18A5A5] hover:bg-[#185166]"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Adding...
            </>
          ) : (
            'Add Card'
          )}
        </Button>
      </div>
    </form>
  );
};

const ManualCardEntryDialog: React.FC<ManualCardEntryDialogProps> = ({
  open,
  onOpenChange,
  customerId,
  onSuccess,
}) => {
  const handleSuccess = () => {
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Add Payment Card
          </DialogTitle>
          <DialogDescription>
            Enter the customer's card details to add a payment method.
          </DialogDescription>
        </DialogHeader>

        <Elements stripe={stripePromise}>
          <CardForm
            customerId={customerId}
            onSuccess={handleSuccess}
            onCancel={() => onOpenChange(false)}
          />
        </Elements>
      </DialogContent>
    </Dialog>
  );
};

export default ManualCardEntryDialog;
