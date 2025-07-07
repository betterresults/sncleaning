import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CreditCard, Plus, Trash2, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useAdminCustomer } from '@/contexts/AdminCustomerContext';

// Initialize Stripe with your publishable key
const stripePromise = loadStripe('pk_test_51PZ9ZqA2n6DFfbTrGY4CadMZLV2CQyTjgc6k6X2tiZFhW8aHwGaxuIDTOEZnXIY3Q48TNZS3yLVuoyQP4gcxhUUA00jD9Mjymb');

interface PaymentMethod {
  id: string;
  card_brand: string;
  card_last4: string;
  card_exp_month: number;
  card_exp_year: number;
  is_default: boolean;
}

// Payment Setup Form Component
const PaymentSetupForm = ({ clientSecret, onSuccess, onCancel }: {
  clientSecret: string;
  onSuccess: () => void;
  onCancel: () => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmSetup({
      elements,
      clientSecret,
      confirmParams: {
        return_url: `${window.location.origin}/customer-settings?payment_setup=success`,
      },
      redirect: 'if_required',
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Payment method added successfully",
      });
      onSuccess();
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4">
        <PaymentElement />
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!stripe || isProcessing}>
          {isProcessing ? 'Processing...' : 'Add Payment Method'}
        </Button>
      </div>
    </form>
  );
};

const PaymentMethodManager = () => {
  const { user, customerId, userRole } = useAuth();
  const { selectedCustomerId } = useAdminCustomer();
  const { toast } = useToast();
  
  // Use selected customer ID if admin is viewing, otherwise use the logged-in user's customer ID  
  const activeCustomerId = userRole === 'admin' ? selectedCustomerId : customerId;
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [setupClientSecret, setSetupClientSecret] = useState<string>('');

  useEffect(() => {
    if (activeCustomerId) {
      fetchPaymentMethods();
    }
  }, [activeCustomerId]);

  const fetchPaymentMethods = async () => {
    if (!activeCustomerId) return;
    
    try {
      const { data, error } = await supabase
        .from('customer_payment_methods')
        .select('*')
        .eq('customer_id', activeCustomerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPaymentMethods(data || []);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      toast({
        title: "Error",
        description: "Failed to load payment methods",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addPaymentMethod = async () => {
    if (!user) return;
    
    try {
      console.log('Starting payment method setup...');
      // Get Setup Intent from backend
      const { data, error } = await supabase.functions.invoke('stripe-setup-intent', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: {
          customerId: activeCustomerId
        }
      });

      if (error) {
        console.error('Setup intent error:', error);
        throw error;
      }

      console.log('Setup intent created:', data);
      setSetupClientSecret(data.clientSecret);
      setShowSetupDialog(true);
    } catch (error) {
      console.error('Error adding payment method:', error);
      toast({
        title: "Error",
        description: "Failed to add payment method",
        variant: "destructive",
      });
    }
  };

  const handleSetupSuccess = async () => {
    setShowSetupDialog(false);
    setSetupClientSecret('');
    await fetchPaymentMethods();
  };

  const deletePaymentMethod = async (id: string) => {
    try {
      const { error } = await supabase
        .from('customer_payment_methods')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPaymentMethods(prev => prev.filter(pm => pm.id !== id));
      toast({
        title: "Success",
        description: "Payment method removed",
      });
    } catch (error) {
      console.error('Error deleting payment method:', error);
      toast({
        title: "Error",
        description: "Failed to remove payment method",
        variant: "destructive",
      });
    }
  };

  const setAsDefault = async (id: string) => {
    try {
      // First, unset all other defaults
      await supabase
        .from('customer_payment_methods')
        .update({ is_default: false })
        .neq('id', id);

      // Then set the selected one as default
      const { error } = await supabase
        .from('customer_payment_methods')
        .update({ is_default: true })
        .eq('id', id);

      if (error) throw error;

      setPaymentMethods(prev => 
        prev.map(pm => ({ ...pm, is_default: pm.id === id }))
      );
      
      toast({
        title: "Success",
        description: "Default payment method updated",
      });
    } catch (error) {
      console.error('Error setting default payment method:', error);
      toast({
        title: "Error",
        description: "Failed to update default payment method",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Methods
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading payment methods...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Methods
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {paymentMethods.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No payment methods added yet</p>
            <p className="text-sm">Add a payment method to book services automatically</p>
          </div>
        ) : (
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium capitalize">
                      {method.card_brand} •••• {method.card_last4}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Expires {method.card_exp_month.toString().padStart(2, '0')}/{method.card_exp_year}
                  </span>
                  {method.is_default && (
                    <div className="flex items-center gap-1 text-green-600 text-sm">
                      <CheckCircle className="h-4 w-4" />
                      Default
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!method.is_default && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAsDefault(method.id)}
                    >
                      Set as Default
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deletePaymentMethod(method.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Button
          onClick={addPaymentMethod}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Payment Method
        </Button>

        {/* Payment Setup Dialog */}
        <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Payment Method</DialogTitle>
            </DialogHeader>
            {setupClientSecret && (
              <Elements 
                stripe={stripePromise} 
                options={{ 
                  clientSecret: setupClientSecret,
                  appearance: { theme: 'stripe' }
                }}
              >
                <PaymentSetupForm
                  clientSecret={setupClientSecret}
                  onSuccess={handleSetupSuccess}
                  onCancel={() => setShowSetupDialog(false)}
                />
              </Elements>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default PaymentMethodManager;