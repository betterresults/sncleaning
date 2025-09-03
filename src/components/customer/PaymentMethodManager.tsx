import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Plus, Trash2, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAdminCustomer } from '@/contexts/AdminCustomerContext';
import PaymentMethodCard from './PaymentMethodCard';

interface PaymentMethod {
  id: string;
  card_brand: string;
  card_last4: string;
  card_exp_month: number;
  card_exp_year: number;
  is_default: boolean;
}

const PaymentMethodManager = () => {
  const { user, customerId, userRole } = useAuth();
  const { selectedCustomerId } = useAdminCustomer();
  const { toast } = useToast();
  
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingPaymentMethod, setIsAddingPaymentMethod] = useState(false);
  
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
    
    setIsAddingPaymentMethod(true);
    
    try {
      console.log('Starting payment method collection for customer:', activeCustomerId);
      
      // Get customer details for the payment method collection
      let customerData = null;
      if (activeCustomerId) {
        const { data } = await supabase
          .from('customers')
          .select('email, first_name, last_name')
          .eq('id', activeCustomerId)
          .maybeSingle();
        customerData = data;
      }

      // Use customer data if available, otherwise use auth user info
      const email = customerData?.email || user.email;
      const name = customerData ? 
        `${customerData.first_name || ''} ${customerData.last_name || ''}`.trim() :
        (user.user_metadata?.first_name || user.user_metadata?.name || 'Customer');

      // Call the payment method collection function
      const { data, error } = await supabase.functions.invoke('stripe-collect-payment-method', {
        body: {
          customer_id: activeCustomerId,
          email: email,
          name: name || 'Customer',
          return_url: `${window.location.origin}/customer-settings?payment_method_added=true`
        }
      });

      if (error) {
        console.error('Payment method collection error:', error);
        throw new Error(error.message || 'Failed to initiate payment method collection');
      }

      if (!data?.checkout_url) {
        throw new Error('No checkout URL returned');
      }

      console.log('Payment method collection initiated, redirecting to:', data.checkout_url);
      
      // Redirect to Stripe Checkout
      window.location.href = data.checkout_url;
      
    } catch (error) {
      console.error('Error adding payment method:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add payment method. Please try again.",
        variant: "destructive",
      });
      setIsAddingPaymentMethod(false);
    }
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
      // First, unset all other defaults for this customer
      if (activeCustomerId) {
        await supabase
          .from('customer_payment_methods')
          .update({ is_default: false })
          .eq('customer_id', activeCustomerId)
          .neq('id', id);
      }

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

  // Handle successful payment method addition from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment_method_added') === 'true') {
      toast({
        title: "Success",
        description: "Payment method added successfully",
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      // Refresh payment methods
      fetchPaymentMethods();
    }
  }, [toast, fetchPaymentMethods]);

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
              <PaymentMethodCard
                key={method.id}
                method={method}
                onSetDefault={setAsDefault}
                onDelete={deletePaymentMethod}
              />
            ))}
          </div>
        )}

        <Button
          onClick={addPaymentMethod}
          disabled={isAddingPaymentMethod}
          className="w-full bg-[#18A5A5] hover:bg-[#185166] text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          {isAddingPaymentMethod ? 'Redirecting to Stripe...' : 'Add Payment Method'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PaymentMethodManager;