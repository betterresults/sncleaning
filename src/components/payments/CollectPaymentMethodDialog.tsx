import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Link, Mail, Search, Check, X } from 'lucide-react';

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
  const [mode, setMode] = useState<'search' | 'collect_only' | 'payment_link'>('search');
  const [amount, setAmount] = useState(booking?.total_cost?.toString() || '');
  const [description, setDescription] = useState(
    booking ? `${booking.cleaning_type} - ${booking.address}` : 'Cleaning Service Payment'
  );
  const [collectForFuture, setCollectForFuture] = useState(true);
  const [searching, setSearching] = useState(false);
  const [stripeCustomers, setStripeCustomers] = useState<any[]>([]);
  const [searchCompleted, setSearchCompleted] = useState(false);

  const handleSearchStripe = async () => {
    setSearching(true);
    setSearchCompleted(false);
    try {
      const { data, error } = await supabase.functions.invoke('search-stripe-customer', {
        body: {
          customerId: customer.id,
          email: customer.email
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
            customerId: customer.id,
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
          description: `Successfully imported ${newMethods.length} payment method(s) for ${customer.first_name} ${customer.last_name}.`,
        });
        
        // Trigger page refresh to show updated payment method status
        setTimeout(() => {
          window.location.reload();
        }, 1500);
        
        onOpenChange(false);
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

  const handleCollectPaymentMethod = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-collect-payment-method', {
        body: {
          customer_id: customer.id,
          email: customer.email,
          name: `${customer.first_name} ${customer.last_name}`.trim(),
          return_url: `https://account.sncleaningservices.co.uk/auth?payment_setup=success&redirect=customer`
        }
      });

      if (error) throw error;

      if (data.checkout_url) {
        toast({
          title: 'Email Sent Successfully',
          description: `Payment method collection link sent to ${customer.email}. Customer can securely add their card details.`,
        });
        
        // Auto-refresh after successful payment method collection
        setTimeout(() => {
          window.location.reload();
        }, 2000);
        
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

        toast({
          title: 'Payment Link Created',
          description: `Payment link sent to ${customer.email}. Customer can pay £${amount}${collectForFuture ? ' and save their card for future invoices' : ''}.`,
        });
        
        // Auto-refresh after successful payment link creation
        setTimeout(() => {
          window.location.reload();
        }, 2000);
        
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

          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={mode === 'search' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('search')}
            >
              <Search className="h-4 w-4 mr-1" />
              Search Stripe
            </Button>
            <Button
              variant={mode === 'collect_only' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('collect_only')}
            >
              <CreditCard className="h-4 w-4 mr-1" />
              Collect New
            </Button>
            <Button
              variant={mode === 'payment_link' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('payment_link')}
            >
              <Link className="h-4 w-4 mr-1" />
              Payment Link
            </Button>
          </div>

          {mode === 'search' && (
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
                {searching ? 'Searching Stripe...' : `Search in Stripe for ${customer.first_name} ${customer.last_name}`}
              </Button>

              {searchCompleted && stripeCustomers.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  <p>No existing Stripe customers found for this email.</p>
                  <p className="text-sm">Use "Collect New" to create a new payment method.</p>
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
          )}

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
              onClick={
                mode === 'collect_only' ? handleCollectPaymentMethod : 
                mode === 'payment_link' ? handleSendPaymentLink : 
                handleSearchStripe
              }
              disabled={loading || searching || (mode === 'search' && !searchCompleted && stripeCustomers.length === 0)}
              className="flex-1"
            >
              {loading || searching ? (
                'Processing...'
              ) : mode === 'collect_only' ? (
                <>
                  <CreditCard className="h-4 w-4 mr-1" />
                  Collect Card
                </>
              ) : mode === 'payment_link' ? (
                <>
                  <Mail className="h-4 w-4 mr-1" />
                  Send Payment Link
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-1" />
                  Search Stripe
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