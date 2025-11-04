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

// Normalize and generate candidate variants for matching
const normalizeServiceType = (input: string | null): string | null => {
  if (!input) return null;
  const key = input.toLowerCase();
  if (key.includes('airbnb')) return 'airbnb';
  return key;
};

const buildServiceCandidates = (input: string | null): string[] => {
  if (!input) return [];
  const lc = input.toLowerCase();
  const variants = new Set<string>([
    lc,
    lc.replace(/-/g, '_'),
    lc.replace(/-/g, ' '),
    lc.replace(/_/g, '-'),
    lc.replace(/[_\s-]+/g, ''),
  ]);
  const normalized = normalizeServiceType(input);
  if (normalized) variants.add(normalized);
  // Known canonical keys
  if (lc.includes('airbnb')) {
    variants.add('airbnb');
    variants.add('airbnb_cleaning');
    variants.add('airbnb-cleaning');
  }
  return Array.from(variants);
};

const normalizeCleaningType = (input: string | null): string | null => {
  if (!input) return null;
  const lc = input.toLowerCase();
  switch (lc) {
    case 'checkin-checkout':
    case 'checkin_checkout':
    case 'check_in_check_out':
      return 'check_in_check_out';
    case 'midstay':
    case 'midstay_cleaning':
      return 'midstay_cleaning';
    case 'light':
    case 'light_cleaning':
      return 'light_cleaning';
    case 'deep':
    case 'deep_cleaning':
      return 'deep_cleaning';
    default:
      return lc.replace(/-/g, '_');
  }
};

const buildCleaningCandidates = (input: string | null): string[] => {
  if (!input) return [];
  const lc = input.toLowerCase();
  const normalized = normalizeCleaningType(lc);
  const variants = new Set<string>([
    lc,
    lc.replace(/-/g, '_'),
    lc.replace(/_/g, '-'),
  ]);
  if (normalized) variants.add(normalized);
  // Add special known canonical
  if (lc.includes('check') && lc.includes('in') && lc.includes('out')) {
    variants.add('check_in_check_out');
  }
  return Array.from(variants);
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
      if (cleaningType) {
        const serviceKeys = buildServiceCandidates(serviceType);
        const cleaningKeys = buildCleaningCandidates(cleaningType);
        const { data } = await supabase
          .from('customer_pricing_overrides')
          .select('*')
          .eq('customer_id', customerId)
          .in('service_type', serviceKeys)
          .in('cleaning_type', cleaningKeys)
          .order('updated_at', { ascending: false })
          .limit(1);
        const exact = Array.isArray(data) ? data[0] : null;
        if (exact) return exact as CustomerPricingOverride;
      }
      
      // Fallback to general service type override (where cleaning_type is null)
      {
        const serviceKeys = buildServiceCandidates(serviceType);
        const { data } = await supabase
          .from('customer_pricing_overrides')
          .select('*')
          .eq('customer_id', customerId)
          .in('service_type', serviceKeys)
          .is('cleaning_type', null)
          .order('updated_at', { ascending: false })
          .limit(1);
        const wildcard = Array.isArray(data) ? data[0] : null;
        return (wildcard as CustomerPricingOverride) || null;
      }
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
