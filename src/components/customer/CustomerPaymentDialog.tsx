import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Plus, Trash2, CheckCircle, Search, Check, X } from 'lucide-react';
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

interface CustomerPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: number;
  customerName: string;
  customerEmail: string;
  onPaymentMethodsChange: () => void;
}

const CustomerPaymentDialog = ({ 
  open, 
  onOpenChange, 
  customerId, 
  customerName, 
  customerEmail,
  onPaymentMethodsChange 
}: CustomerPaymentDialogProps) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'view' | 'search'>('view');
  const [searching, setSearching] = useState(false);
  const [stripeCustomers, setStripeCustomers] = useState<any[]>([]);
  const [searchCompleted, setSearchCompleted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && customerId) {
      fetchPaymentMethods();
    }
  }, [open, customerId]);

  const fetchPaymentMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_payment_methods')
        .select('*')
        .eq('customer_id', customerId);

      if (error) throw error;
      setPaymentMethods(data || []);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payment methods',
        variant: 'destructive',
      });
    }
  };

  const handleSearchStripe = async () => {
    setSearching(true);
    setSearchCompleted(false);
    try {
      const { data, error } = await supabase.functions.invoke('search-stripe-customer', {
        body: {
          customerId: customerId,
          email: customerEmail
        }
      });

      if (error) throw error;

      setStripeCustomers(data.customers || []);
      setSearchCompleted(true);
      
      if (data.customers?.length > 0) {
        toast({
          title: 'Search Complete',
          description: `Found ${data.customers.length} existing Stripe customer(s) with ${data.customers.reduce((total: number, c: any) => total + c.new_payment_methods, 0)} new payment methods available to import.`,
        });
      } else {
        toast({
          title: 'No Existing Customers Found',
          description: 'No existing Stripe customers found for this email. You can collect a new payment method.',
        });
      }
    } catch (error: any) {
      console.error('Error searching Stripe:', error);
      toast({
        title: 'Search Error',
        description: error.message || 'Failed to search Stripe customers',
        variant: 'destructive',
      });
    } finally {
      setSearching(false);
    }
  };

  const handleImportPaymentMethods = async (stripeCustomerId: string, paymentMethods: any[]) => {
    setLoading(true);
    try {
      const newMethods = paymentMethods.filter(pm => !pm.already_imported);
      
      for (const pm of newMethods) {
        const { error } = await supabase.functions.invoke('manual-sync-payment-method', {
          body: {
            customerId: customerId,
            stripeCustomerId,
            paymentMethodId: pm.id
          }
        });

        if (error) {
          console.error(`Failed to import payment method ${pm.id}:`, error);
        }
      }

      toast({
        title: 'Payment Methods Imported',
        description: `Successfully imported ${newMethods.length} payment method(s) for ${customerName}.`,
      });
      
      fetchPaymentMethods();
      onPaymentMethodsChange();
      
      // Auto-refresh after successful import
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (error: any) {
      console.error('Error importing payment methods:', error);
      toast({
        title: 'Import Error',
        description: error.message || 'Failed to import payment methods',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddPaymentMethod = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-collect-payment-method', {
        body: {
          customer_id: customerId,
          email: customerEmail,
          name: customerName,
          return_url: `${window.location.origin}/users`
        }
      });

      if (error) throw error;

      if (data.checkout_url) {
        window.open(data.checkout_url, '_blank');
        toast({
          title: 'Add Payment Method',
          description: 'Customer will be redirected to securely add their payment method.',
        });
        
        // Auto-refresh after successful payment method collection
        setTimeout(() => {
          window.location.reload();
        }, 2000);
        
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error('Error adding payment method:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add payment method',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePaymentMethod = async (paymentMethodId: string) => {
    try {
      const { error } = await supabase
        .from('customer_payment_methods')
        .delete()
        .eq('id', paymentMethodId);

      if (error) throw error;

      setPaymentMethods(prev => prev.filter(pm => pm.id !== paymentMethodId));
      onPaymentMethodsChange();
      
      toast({
        title: 'Success',
        description: 'Payment method removed successfully',
      });
    } catch (error: any) {
      console.error('Error deleting payment method:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove payment method',
        variant: 'destructive',
      });
    }
  };

  const handleSetDefault = async (paymentMethodId: string) => {
    try {
      // First, unset all other defaults
      await supabase
        .from('customer_payment_methods')
        .update({ is_default: false })
        .eq('customer_id', customerId);

      // Then set the selected one as default
      const { error } = await supabase
        .from('customer_payment_methods')
        .update({ is_default: true })
        .eq('id', paymentMethodId);

      if (error) throw error;

      setPaymentMethods(prev => 
        prev.map(pm => ({ ...pm, is_default: pm.id === paymentMethodId }))
      );
      
      onPaymentMethodsChange();
      
      toast({
        title: 'Success',
        description: 'Default payment method updated',
      });
    } catch (error: any) {
      console.error('Error setting default payment method:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update default payment method',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#185166]">
            <CreditCard className="h-5 w-5" />
            Payment Methods - {customerName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            Customer: {customerName} ({customerEmail})
          </div>

          {/* Mode Selection */}
          <div className="flex gap-2">
            <Button
              variant={mode === 'view' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('view')}
            >
              <CreditCard className="h-4 w-4 mr-1" />
              View Methods
            </Button>
            <Button
              variant={mode === 'search' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('search')}
            >
              <Search className="h-4 w-4 mr-1" />
              Search in Stripe
            </Button>
          </div>

          {mode === 'view' ? (
            <>
              {/* Payment Methods List */}
          <div className="space-y-3">
            {paymentMethods.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <CreditCard className="h-12 w-12 mx-auto text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">No payment methods found</p>
                  <p className="text-sm text-gray-500">
                    This customer hasn't added any payment methods yet
                  </p>
                </div>
              </div>
            ) : (
              paymentMethods.map((method) => (
                <Card key={method.id} className="border-[#18A5A5]/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-[#18A5A5]" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium capitalize text-[#185166]">
                              {method.card_brand} •••• {method.card_last4}
                            </span>
                            {method.is_default && (
                              <div className="flex items-center gap-1 text-green-600 text-sm">
                                <CheckCircle className="h-4 w-4" />
                                <span>Default</span>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            Expires {method.card_exp_month.toString().padStart(2, '0')}/{method.card_exp_year}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!method.is_default && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetDefault(method.id)}
                          >
                            Set as Default
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePaymentMethod(method.id)}
                          className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

              {/* Add Payment Method Button */}
              <Button
                onClick={handleAddPaymentMethod}
                disabled={loading}
                className="w-full bg-[#18A5A5] hover:bg-[#185166] text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                {loading ? 'Creating...' : 'Add New Payment Method'}
              </Button>
            </>
          ) : (
            <>
              {/* Search in Stripe Section */}
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Search for existing Stripe customers and import their saved payment methods instead of asking them to re-enter details.
                  </p>
                </div>
                
                <Button
                  onClick={handleSearchStripe}
                  disabled={searching}
                  className="w-full"
                >
                  <Search className={`h-4 w-4 mr-2 ${searching ? 'animate-spin' : ''}`} />
                  {searching ? 'Searching Stripe...' : `Search in Stripe for ${customerName}`}
                </Button>

                {searchCompleted && stripeCustomers.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>No existing Stripe customers found for this email.</p>
                    <p className="text-sm">Use "Add New Payment Method" to create a new payment method.</p>
                  </div>
                )}

                {stripeCustomers.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Found Existing Stripe Customers:</h4>
                    {stripeCustomers.map((stripeCustomer, index) => (
                      <div key={stripeCustomer.stripe_customer_id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{stripeCustomer.name || 'No name'}</p>
                            <p className="text-sm text-muted-foreground">{stripeCustomer.email}</p>
                            <p className="text-xs text-muted-foreground">
                              Customer ID: {stripeCustomer.stripe_customer_id}
                            </p>
                          </div>
                          <div className="text-right text-sm">
                            <p>{stripeCustomer.total_payment_methods} total methods</p>
                            <p className="text-green-600">{stripeCustomer.new_payment_methods} new available</p>
                          </div>
                        </div>
                        
                        {stripeCustomer.payment_methods.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Payment Methods:</p>
                            {stripeCustomer.payment_methods.map((pm: any) => (
                              <div key={pm.id} className="flex items-center justify-between text-sm bg-muted/30 p-2 rounded">
                                <span>**** **** **** {pm.last4} ({pm.brand.toUpperCase()}) {pm.exp_month}/{pm.exp_year}</span>
                                {pm.already_imported ? (
                                  <span className="text-green-600 flex items-center gap-1">
                                    <Check className="h-3 w-3" />
                                    Already imported
                                  </span>
                                ) : (
                                  <span className="text-blue-600">Available to import</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {stripeCustomer.new_payment_methods > 0 && (
                          <Button
                            onClick={() => handleImportPaymentMethods(stripeCustomer.stripe_customer_id, stripeCustomer.payment_methods)}
                            disabled={loading}
                            size="sm"
                            className="w-full"
                          >
                            {loading ? 'Importing...' : `Import ${stripeCustomer.new_payment_methods} Payment Method(s)`}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Close Button */}
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerPaymentDialog;