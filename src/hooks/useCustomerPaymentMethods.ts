import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CustomerPaymentData {
  customer_id: number;
  payment_method_count: number;
  has_stripe_account: boolean;
}

export const useCustomerPaymentMethods = (customerIds: number[]) => {
  const [paymentData, setPaymentData] = useState<{ [key: number]: CustomerPaymentData }>({});
  const [loading, setLoading] = useState(true);

  const fetchPaymentData = async () => {
    if (customerIds.length === 0) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch payment method counts
      const { data: paymentMethods, error } = await supabase
        .from('customer_payment_methods')
        .select('customer_id, stripe_customer_id')
        .in('customer_id', customerIds);

      if (error) throw error;

      // Process data to get counts and Stripe status
      const processedData: { [key: number]: CustomerPaymentData } = {};
      
      customerIds.forEach(id => {
        const customerMethods = paymentMethods?.filter(pm => pm.customer_id === id) || [];
        processedData[id] = {
          customer_id: id,
          payment_method_count: customerMethods.length,
          has_stripe_account: customerMethods.some(pm => pm.stripe_customer_id),
        };
      });

      setPaymentData(processedData);
    } catch (error) {
      console.error('Error fetching payment data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentData();
  }, [customerIds.join(',')]);

  return {
    paymentData,
    loading,
    refetch: fetchPaymentData,
  };
};