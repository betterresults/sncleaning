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
      const serviceKeys = Array.from(new Set([
        serviceType,
        serviceType?.replace(/-/g, ' '),
        serviceType?.replace(/-/g, '_'),
        serviceType?.replace(/_/g, '-'),
      ].filter(Boolean) as string[]));
      if ((serviceType || '').toLowerCase().includes('airbnb')) {
        serviceKeys.push('airbnb', 'airbnb-cleaning', 'airbnb_cleaning');
      }

      // First, try to find an exact match with the specific cleaning type
      if (cleaningType) {
        const cleaningKeys = Array.from(new Set([
          cleaningType,
          cleaningType?.toLowerCase(),
          cleaningType?.replace(/-/g, '_'),
          cleaningType?.replace(/_/g, '-'),
        ].filter(Boolean) as string[]));
        // Known canonical for check-in/out
        const lc = (cleaningType || '').toLowerCase();
        if (lc.includes('check') && lc.includes('in') && lc.includes('out')) {
          cleaningKeys.push('check_in_check_out');
        }

        const { data, error } = await supabase
          .from('customer_pricing_overrides')
          .select('*')
          .eq('customer_id', customerId)
          .in('service_type', serviceKeys)
          .in('cleaning_type', cleaningKeys)
          .order('updated_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error('[useCustomerPricingOverride] Error fetching exact match:', error);
        }

        const exactMatch = Array.isArray(data) ? data[0] : null;
        if (exactMatch) {
          console.log('[useCustomerPricingOverride] Found exact match:', exactMatch);
          return exactMatch;
        }
      }

      // If no exact match, look for a wildcard override (cleaning_type is NULL)
      const { data, error } = await supabase
        .from('customer_pricing_overrides')
        .select('*')
        .eq('customer_id', customerId)
        .in('service_type', serviceKeys)
        .is('cleaning_type', null)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('[useCustomerPricingOverride] Error fetching wildcard match:', error);
      }

      const wildcardMatch = Array.isArray(data) ? data[0] : null;
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
