import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, CreditCard, User, Mail, CheckCircle, AlertCircle, Import } from 'lucide-react';
import PaymentMethodManager from './PaymentMethodManager';
import { AdminCustomerProvider, useAdminCustomer } from '@/contexts/AdminCustomerContext';

interface CustomerPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: number;
  customerName: string;
  customerEmail: string;
  onPaymentMethodsChange?: () => void;
}

interface StripeCustomer {
  stripe_customer_id: string;
  name: string | null;
  email: string | null;
  created: number;
  payment_methods: StripePaymentMethod[];
  total_payment_methods: number;
  new_payment_methods: number;
}

interface StripePaymentMethod {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  already_imported: boolean;
}

// Payment Manager Wrapper with Customer Context
const PaymentManagerWithCustomer = ({ customerId }: { customerId: number }) => {
  const { setSelectedCustomerId } = useAdminCustomer();
  
  useEffect(() => {
    setSelectedCustomerId(customerId);
    return () => setSelectedCustomerId(null);
  }, [customerId, setSelectedCustomerId]);

  return <PaymentMethodManager />;
};

const CustomerPaymentDialog = ({ 
  open, 
  onOpenChange, 
  customerId, 
  customerName, 
  customerEmail,
  onPaymentMethodsChange 
}: CustomerPaymentDialogProps) => {
  const { toast } = useToast();
  const [searching, setSearching] = useState(false);
  const [importing, setImporting] = useState(false);
  const [searchResults, setSearchResults] = useState<StripeCustomer[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searchEmail, setSearchEmail] = useState(customerEmail);
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<Set<string>>(new Set());
  const [hasExistingMethods, setHasExistingMethods] = useState(false);

  // Check if customer already has payment methods
  useEffect(() => {
    const checkExistingMethods = async () => {
      const { data, error } = await supabase
        .from('customer_payment_methods')
        .select('id')
        .eq('customer_id', customerId)
        .limit(1);
      
      setHasExistingMethods(data && data.length > 0);
    };
    
    if (open && customerId) {
      checkExistingMethods();
      setSearchEmail(customerEmail); // Reset search email when dialog opens
      setShowResults(false);
      setSelectedPaymentMethods(new Set());
    }
  }, [open, customerId, customerEmail]);

  const handleSearchStripe = async () => {
    setSearching(true);
    setSearchResults([]);
    
    try {
      const { data, error } = await supabase.functions.invoke('search-stripe-customer', {
        body: { 
          customerId: customerId,
          email: searchEmail 
        }
      });
      
      if (error) throw error;
      
      if (data.customers_found === 0) {
        // Show debug info if no customers found
        let debugMessage = `No Stripe customer found with email: ${data.search_email}`;
        if (data.debug_recent_customers && data.debug_recent_customers.length > 0) {
          const recentEmails = data.debug_recent_customers.slice(0, 5).map((c: any) => c.email).filter(Boolean);
          if (recentEmails.length > 0) {
            debugMessage += `\n\nRecent Stripe customers found: ${recentEmails.join(', ')}`;
          }
        }
        
        toast({
          title: "No Stripe Account Found",
          description: debugMessage,
          variant: "destructive",
        });
      } else {
        setSearchResults(data.customers);
        setShowResults(true);
        toast({
          title: "Search Complete",
          description: `Found ${data.customers_found} Stripe customer${data.customers_found > 1 ? 's' : ''} with ${data.customers.reduce((acc: number, c: StripeCustomer) => acc + c.new_payment_methods, 0)} new payment methods available.`,
        });
      }
    } catch (error) {
      console.error('Error searching Stripe:', error);
      toast({
        title: "Search Error",
        description: "Failed to search Stripe. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const handleImportSelected = async (stripeCustomerId: string) => {
    if (selectedPaymentMethods.size === 0) {
      toast({
        title: "No Methods Selected",
        description: "Please select at least one payment method to import.",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('import-stripe-payment-methods', {
        body: {
          customerId: customerId,
          stripeCustomerId: stripeCustomerId,
          paymentMethodIds: Array.from(selectedPaymentMethods),
          setFirstAsDefault: !hasExistingMethods
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Import Successful",
        description: `Successfully imported ${data.imported_count} payment method${data.imported_count > 1 ? 's' : ''}.`,
      });
      
      // Reset state and trigger refresh
      setSelectedPaymentMethods(new Set());
      setShowResults(false);
      if (onPaymentMethodsChange) {
        onPaymentMethodsChange();
      }
    } catch (error) {
      console.error('Error importing payment methods:', error);
      toast({
        title: "Import Error",
        description: "Failed to import payment methods. Please try again.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const togglePaymentMethodSelection = (paymentMethodId: string) => {
    const newSelected = new Set(selectedPaymentMethods);
    if (newSelected.has(paymentMethodId)) {
      newSelected.delete(paymentMethodId);
    } else {
      newSelected.add(paymentMethodId);
    }
    setSelectedPaymentMethods(newSelected);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Payment Methods for {customerName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Customer Info & Search Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium">{customerName}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {customerEmail}
                  </p>
                  <p className="text-sm text-muted-foreground">ID: {customerId}</p>
                </div>
                <div className="flex items-end justify-end">
                  {hasExistingMethods && (
                    <div className="flex items-center gap-1 text-green-600 text-sm">
                      <CheckCircle className="h-4 w-4" />
                      Has payment methods
                    </div>
                  )}
                </div>
              </div>

              {!showResults && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="search-email">Search Email (optional override)</Label>
                    <Input
                      id="search-email"
                      type="email"
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                      placeholder="Enter email to search in Stripe"
                    />
                  </div>
                  
                  <Button
                    onClick={handleSearchStripe}
                    disabled={searching || !searchEmail}
                    className="w-full"
                  >
                    {searching ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Search className="h-4 w-4 mr-2" />
                    )}
                    Search Stripe Customer
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Search Results */}
          {showResults && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Stripe Search Results
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowResults(false)}
                  >
                    New Search
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {searchResults.map((customer, index) => (
                  <div key={customer.stripe_customer_id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">
                          {customer.name || 'No name'} ({customer.email})
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Stripe ID: {customer.stripe_customer_id}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Created: {new Date(customer.created * 1000).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {customer.new_payment_methods} new methods available
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {customer.total_payment_methods} total methods
                        </p>
                      </div>
                    </div>

                    {customer.payment_methods.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No payment methods found for this customer</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <h5 className="font-medium text-sm">Payment Methods:</h5>
                        {customer.payment_methods.map((method) => (
                          <div
                            key={method.id}
                            className={`flex items-center justify-between p-3 border rounded ${
                              method.already_imported ? 'bg-muted/50' : 'hover:bg-muted/30'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {!method.already_imported && (
                                <Checkbox
                                  checked={selectedPaymentMethods.has(method.id)}
                                  onCheckedChange={() => togglePaymentMethodSelection(method.id)}
                                />
                              )}
                              <div className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                                <span className="capitalize">
                                  {method.brand} •••• {method.last4}
                                </span>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {method.exp_month.toString().padStart(2, '0')}/{method.exp_year}
                              </span>
                            </div>
                            {method.already_imported && (
                              <div className="flex items-center gap-1 text-green-600 text-sm">
                                <CheckCircle className="h-4 w-4" />
                                Already imported
                              </div>
                            )}
                          </div>
                        ))}

                        {customer.new_payment_methods > 0 && (
                          <Button
                            onClick={() => handleImportSelected(customer.stripe_customer_id)}
                            disabled={importing || selectedPaymentMethods.size === 0}
                            className="w-full"
                          >
                            {importing ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Import className="h-4 w-4 mr-2" />
                            )}
                            Import Selected Methods ({selectedPaymentMethods.size})
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Existing Payment Methods Manager */}
          <AdminCustomerProvider>
            <PaymentManagerWithCustomer customerId={customerId} />
          </AdminCustomerProvider>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerPaymentDialog;