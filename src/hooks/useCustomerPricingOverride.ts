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

// Normalize incoming values to match DB tokens
const normalizeServiceType = (input: string | null): string | null => {
  if (!input) return null;
  const key = input.toLowerCase().replace(/\s+/g, '').replace(/_/g, '').replace(/-/g, '');
  // Map known variants to canonical DB value
  if (key.includes('airbnb')) return 'airbnb';
  return input; // fallback to original
};

const normalizeCleaningType = (input: string | null): string | null => {
  if (!input) return null;
  switch (input) {
    case 'checkin-checkout':
      return 'check_in_check_out';
    case 'midstay':
      return 'midstay_cleaning';
    case 'light':
      return 'light_cleaning';
    case 'deep':
      return 'deep_cleaning';
    default:
      // also try converting hyphens to underscores
      return input.replace(/-/g, '_');
  }
};

export const useCustomerPricingOverride = (
  customerId: number | null,
  serviceType: string | null,
  cleaningType: string | null
) => {
  return useQuery({
    queryKey: ['customer-pricing-override', customerId, serviceType, cleaningType],
    queryFn: async () => {
      if (!customerId || !serviceType) return null;

      const normalizedService = normalizeServiceType(serviceType);
      const normalizedCleaning = normalizeCleaningType(cleaningType);

      // Try to find specific cleaning type override first
      if (normalizedCleaning) {
        const { data } = await supabase
          .from('customer_pricing_overrides')
          .select('*')
          .eq('customer_id', customerId)
          .eq('service_type', normalizedService)
          .eq('cleaning_type', normalizedCleaning)
          .maybeSingle();
          
        if (data) return data as CustomerPricingOverride;
      }
      
      // Fallback to general service type override (where cleaning_type is null)
      const { data } = await supabase
        .from('customer_pricing_overrides')
        .select('*')
        .eq('customer_id', customerId)
        .eq('service_type', normalizedService)
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
