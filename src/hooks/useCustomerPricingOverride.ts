import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CustomerPricingOverride {
  id: string;
  customer_id: number;
  service_type: string;
  cleaning_type: string | null;
  override_rate: number;
  created_at: string;
  updated_at: string;
}

export const useCustomerPricingOverride = (
  customerId: number | null,
  serviceType: string | null,
  cleaningType: string | null
) => {
  return useQuery({
    queryKey: ['customer-pricing-override', customerId, serviceType, cleaningType],
    queryFn: async () => {
      if (!customerId || !serviceType) return null;
      
      // Try to find specific cleaning type override first
      if (cleaningType) {
        const { data } = await supabase
          .from('customer_pricing_overrides')
          .select('*')
          .eq('customer_id', customerId)
          .eq('service_type', serviceType)
          .eq('cleaning_type', cleaningType)
          .maybeSingle();
          
        if (data) return data as CustomerPricingOverride;
      }
      
      // Fallback to general service type override (where cleaning_type is null)
      const { data } = await supabase
        .from('customer_pricing_overrides')
        .select('*')
        .eq('customer_id', customerId)
        .eq('service_type', serviceType)
        .is('cleaning_type', null)
        .maybeSingle();
        
      return data as CustomerPricingOverride | null;
    },
    enabled: !!customerId && !!serviceType
  });
};

export const useAllCustomerPricingOverrides = () => {
  return useQuery({
    queryKey: ['all-customer-pricing-overrides'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_pricing_overrides')
        .select(`
          *,
          customers (
            id,
            first_name,
            last_name,
            full_name
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });
};
