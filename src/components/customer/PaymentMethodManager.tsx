import React, { useState, useEffect, useCallback } from 'react';
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
const PaymentSetupForm = ({ clientSecret, onSuccess, onCancel, customerId }: {
  clientSecret: string;
  onSuccess: () => void;
  onCancel: () => void;
  customerId: number | null;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    console.log('Form submitted, checking stripe and elements...');

    if (!stripe || !elements) {
      console.log('Stripe or elements not ready:', { stripe: !!stripe, elements: !!elements });
      return;
    }

    console.log('Starting payment setup...');
    setIsProcessing(true);

    try {
      // First submit the elements
      console.log('Submitting elements...');
      const { error: submitError } = await elements.submit();
      
      if (submitError) {
        console.error('Elements submit error:', submitError);
        throw submitError;
      }

      console.log('Elements submitted successfully, now confirming setup...');
      const { error } = await stripe.confirmSetup({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `https://account.sncleaningservices.co.uk/auth?payment_setup=success`,
        },
        redirect: 'if_required',
      });

      console.log('Stripe confirmSetup result:', { error });

      // Check if setup intent actually succeeded despite the error
      const setupIntentSucceeded = error?.setup_intent?.status === 'succeeded';
      const hasPaymentMethod = error?.setup_intent?.payment_method;

      if (error && !setupIntentSucceeded) {
        console.error('Stripe error:', error);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        // Either no error, or error but setup intent succeeded
        const setupIntentId = setupIntentSucceeded 
          ? error.setup_intent.id 
          : clientSecret.split('_secret_')[0];
          
        console.log('Payment setup successful! Now saving to database...', { setupIntentId });
        
        // Save payment method to our database
        try {
          const { data: saveData, error: saveError } = await supabase.functions.invoke('stripe-save-payment-method', {
            headers: {
              Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            },
            body: {
              setupIntentId,
              customerId: customerId
            }
          });

          if (saveError) {
            console.error('Save error:', saveError);
            throw saveError;
          }

          console.log('Payment method saved to database:', saveData);
          toast({
            title: "Success",
            description: "Payment method added successfully",
          });
          onSuccess();
        } catch (saveErr) {
          console.error('Error saving payment method:', saveErr);
          toast({
            title: "Warning",
            description: "Payment method was added to Stripe but failed to save locally. Please refresh the page.",
            variant: "destructive",
          });
        }
      }
    } catch (err) {
      console.error('Exception during confirmSetup:', err);
      toast({
        title: "Error", 
        description: "An unexpected error occurred",
        variant: "destructive",
      });
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
  
  // All hooks must be called before any conditional logic
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [setupClientSecret, setSetupClientSecret] = useState<string>('');
  
  // Use selected customer ID if admin is viewing, otherwise use the logged-in user's customer ID  
  const activeCustomerId = userRole === 'admin' ? selectedCustomerId : customerId;

  const fetchPaymentMethods = useCallback(async () => {
    if (!activeCustomerId) {
      console.log('PaymentMethodManager: No activeCustomerId, skipping fetch');
      return;
    }
    
    console.log('PaymentMethodManager: Fetching payment methods for customer:', activeCustomerId);
    
    try {
      // First sync payment methods with Stripe to ensure data consistency
      console.log('PaymentMethodManager: Syncing with Stripe...');
      const { error: syncError } = await supabase.functions.invoke('sync-payment-methods', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: {
          customerId: activeCustomerId
        }
      });

      if (syncError) {
        console.warn('Sync warning:', syncError);
        // Continue with fetch even if sync fails
      }

      // Now fetch the updated payment methods
      const { data, error } = await supabase
        .from('customer_payment_methods')
        .select('*')
        .eq('customer_id', activeCustomerId)
        .order('created_at', { ascending: false });

      console.log('PaymentMethodManager: Fetch result:', { data, error, activeCustomerId });

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
  }, [activeCustomerId, toast]);

  useEffect(() => {
    if (activeCustomerId) {
      fetchPaymentMethods();
    }
  }, [activeCustomerId, fetchPaymentMethods]);
  
  // Show message if admin hasn't selected a customer
  if (userRole === 'admin' && !selectedCustomerId) {
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
            <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Select a customer first to manage their payment methods</p>
          </div>
        </CardContent>
      </Card>
    );
  }

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
    <Card className="border-0">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-[#185166] text-xl">
          <div className="p-2 bg-[#18A5A5]/10 rounded-lg">
            <CreditCard className="h-5 w-5 text-[#18A5A5]" />
          </div>
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
                className="flex items-center justify-between p-4 border border-gray-100 rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium capitalize text-[#185166]">
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
                      className="border-[#18A5A5] text-[#18A5A5] hover:bg-[#18A5A5] hover:text-white"
                    >
                      Set as Default
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deletePaymentMethod(method.id)}
                    className="border-gray-300 text-gray-600 hover:bg-red-50 hover:border-red-300 hover:text-red-600"
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
          className="w-full bg-[#18A5A5] hover:bg-[#185166] text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Payment Method
        </Button>

        {/* Payment Setup Dialog */}
        <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
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
                  customerId={activeCustomerId}
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