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
const stripePromise = loadStripe('pk_live_51PZ9ZqA2n6DFfbTrTLLl88IeUPjKnwzJwsMI8Hsa4sjp7GrdNT8Ln0bWWrQNhqLAORlf3Xk1WhrHroZLPDHmdCK100vhGQzXID');

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
  const [elementError, setElementError] = useState<string | null>(null);

  // Handle Stripe element errors
  useEffect(() => {
    const handleElementError = (event: any) => {
      console.error('Stripe Element error:', event.error);
      setElementError(event.error?.message || 'Payment form error');
      toast({
        title: "Payment Setup Error",
        description: event.error?.message || 'There was an error setting up the payment form. Please try again.',
        variant: "destructive",
      });
    };

    // Listen for element errors
    if (elements) {
      const paymentElement = elements.getElement('payment');
      if (paymentElement) {
        paymentElement.on('loaderror', handleElementError);
        return () => {
          paymentElement.off('loaderror', handleElementError);
        };
      }
    }
  }, [elements, toast]);

  if (elementError) {
    return (
      <div className="space-y-4">
        <div className="p-6 text-center border border-red-200 rounded-lg bg-red-50">
          <div className="text-red-600 mb-2">
            <svg className="h-8 w-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="font-medium text-red-800 mb-2">Payment Setup Error</h3>
          <p className="text-sm text-red-600 mb-4">{elementError}</p>
          <p className="text-xs text-red-500">Please contact support if this error persists.</p>
        </div>
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Close
          </Button>
          <Button 
            type="button" 
            onClick={() => {
              setElementError(null);
              // Trigger a retry by calling onCancel and letting user try again
              onCancel();
            }}
            className="bg-[#18A5A5] hover:bg-[#185166] text-white"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

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
      <div className="p-4 border border-gray-100 rounded-lg bg-gray-50">
        <PaymentElement 
          onReady={() => console.log('PaymentElement ready')}
          onLoadError={(error) => {
            console.error('PaymentElement load error:', error);
            setElementError(error?.error?.message || 'Failed to load payment form');
          }}
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!stripe || isProcessing} className="bg-[#18A5A5] hover:bg-[#185166] text-white">
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
      setLoading(false);
      return;
    }
    
    console.log('PaymentMethodManager: Fetching payment methods for customer:', activeCustomerId);
    
    try {
      // Fetch payment methods directly without slow sync
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

  // Show message if customer doesn't have a customer ID
  if (userRole !== 'admin' && !customerId) {
    // For customers without customer_id, we'll allow them to proceed
    // The stripe-setup-intent function will handle creating their customer record
    console.log('PaymentMethodManager: Customer has no customer_id, but allowing payment method creation');
  }

  const addPaymentMethod = async () => {
    if (!user) return;
    
    // Show dialog immediately with loading state
    setShowSetupDialog(true);
    setSetupClientSecret(''); // Reset to trigger loading state
    
    try {
      console.log('Starting payment method setup for customer:', activeCustomerId);
      // Get Setup Intent from backend - let stripe-setup-intent handle customer creation
      const { data, error } = await supabase.functions.invoke('stripe-setup-intent', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: {
          customerId: activeCustomerId  // This can be null for new customers
        }
      });

      if (error) {
        console.error('Setup intent error:', error);
        throw new Error(error.message || 'Failed to create payment setup');
      }

      if (!data?.clientSecret) {
        throw new Error('No client secret returned from payment setup');
      }

      console.log('Setup intent created successfully');
      setSetupClientSecret(data.clientSecret);
    } catch (error) {
      console.error('Error adding payment method:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add payment method. Please try again.",
        variant: "destructive",
      });
      setShowSetupDialog(false); // Close dialog on error
    }
  };

  const handleSetupSuccess = async () => {
    setShowSetupDialog(false);
    setSetupClientSecret('');
    // Small delay to prevent immediate re-render issues
    setTimeout(() => {
      fetchPaymentMethods();
    }, 100);
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
          <div className="p-2 bg-[#18A5A5] rounded-lg border border-white/20 shadow-sm">
            <CreditCard className="h-5 w-5 text-white" />
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
        <Dialog open={showSetupDialog} onOpenChange={(open) => {
          if (!open) {
            setSetupClientSecret('');
          }
          setShowSetupDialog(open);
        }}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-[#185166] flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Add Payment Method
              </DialogTitle>
            </DialogHeader>
            {!setupClientSecret ? (
              <div className="space-y-4">
                <div className="p-8 text-center">
                  <div className="animate-spin h-8 w-8 border-4 border-[#18A5A5] border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-[#185166] font-medium">Setting up payment form...</p>
                  <p className="text-sm text-muted-foreground">This will just take a moment</p>
                </div>
                <div className="flex justify-end">
                  <Button type="button" variant="outline" onClick={() => {
                    setSetupClientSecret('');
                    setShowSetupDialog(false);
                  }}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Elements 
                stripe={stripePromise} 
                key={setupClientSecret} // Force re-mount when clientSecret changes
                options={{ 
                  clientSecret: setupClientSecret,
                  appearance: { 
                    theme: 'stripe',
                    variables: {
                      colorPrimary: '#18A5A5',
                    }
                  }
                }}
              >
                <PaymentSetupForm
                  clientSecret={setupClientSecret}
                  onSuccess={handleSetupSuccess}
                  onCancel={() => {
                    setSetupClientSecret('');
                    setShowSetupDialog(false);
                  }}
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