import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const usePaymentMethodCheck = (customerId: number | null) => {
  const [hasPaymentMethods, setHasPaymentMethods] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customerId) {
      setHasPaymentMethods(false);
      setLoading(false);
      return;
    }

    const checkPaymentMethods = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('customer_payment_methods')
          .select('id')
          .eq('customer_id', customerId)
          .limit(1);

        if (error) throw error;

        setHasPaymentMethods(data && data.length > 0);
      } catch (error) {
        console.error('Error checking payment methods:', error);
        setHasPaymentMethods(false);
      } finally {
        setLoading(false);
      }
    };

    checkPaymentMethods();
  }, [customerId]);

  return { hasPaymentMethods, loading };
};
