import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useCustomerPricingOverride = (
  customerId: number | null,
  serviceType: string | null,
  cleaningType: string | null
) => {
  return useQuery({
    queryKey: ['customer-pricing-override', customerId, serviceType, cleaningType],
    queryFn: async () => {
      if (!customerId || !serviceType) {
        console.log('[useCustomerPricingOverride] Missing customer or service type');
        return null;
      }

      console.log('[useCustomerPricingOverride] Searching for override:', {
        customerId,
        serviceType,
        cleaningType
      });

      // First, try to find an exact match with the specific cleaning type
      if (cleaningType) {
        const { data: exactMatch, error: exactError } = await supabase
          .from('customer_pricing_overrides')
          .select('*')
          .eq('customer_id', customerId)
          .eq('service_type', serviceType)
          .eq('cleaning_type', cleaningType)
          .maybeSingle();

        if (exactError) {
          console.error('[useCustomerPricingOverride] Error fetching exact match:', exactError);
        }

        if (exactMatch) {
          console.log('[useCustomerPricingOverride] Found exact match:', exactMatch);
          return exactMatch;
        }
      }

      // If no exact match, look for a wildcard override (cleaning_type is NULL)
      const { data: wildcardMatch, error: wildcardError } = await supabase
        .from('customer_pricing_overrides')
        .select('*')
        .eq('customer_id', customerId)
        .eq('service_type', serviceType)
        .is('cleaning_type', null)
        .maybeSingle();

      if (wildcardError) {
        console.error('[useCustomerPricingOverride] Error fetching wildcard match:', wildcardError);
      }

      if (wildcardMatch) {
        console.log('[useCustomerPricingOverride] Found wildcard match (applies to all):', wildcardMatch);
        return wildcardMatch;
      }

      console.log('[useCustomerPricingOverride] No override found');
      return null;
    },
    enabled: !!customerId && !!serviceType,
  });
};
