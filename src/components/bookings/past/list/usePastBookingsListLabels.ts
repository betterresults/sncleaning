import {
  useCleaningTypes,
  useServiceTypes,
  getServiceTypeBadgeColor as getBadgeColor,
} from '@/hooks/useCompanySettings';

function humanize(val?: string | null) {
  if (!val) return '';
  return val
    .replace(/-/g, '_')
    .split('_')
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(' ');
}

function normalizeKey(key: string) {
  return key.toLowerCase().replace(/-/g, '_').replace(/\s+/g, '_');
}

export function usePastBookingsListLabels() {
  const { data: serviceTypes } = useServiceTypes();
  const { data: cleaningTypes } = useCleaningTypes();

  const getServiceTypeLabel = (key?: string | null) => {
    if (!key) return '';

    let found = serviceTypes?.find((st) => st.key === key);
    if (!found) {
      const normalizedKey = normalizeKey(key);
      found = serviceTypes?.find((st) => normalizeKey(st.key) === normalizedKey);
    }

    if (!found) {
      const serviceTypeMap: Record<string, string> = {
        airbnb: 'Airbnb',
        domestic: 'Domestic',
        commercial: 'Commercial',
        check_in_check_out: 'Check-in/Check-out',
        checkin_checkout: 'Check-in/Check-out',
        standard_cleaning: 'Standard Cleaning',
        deep_cleaning: 'Deep Cleaning',
      };
      const mapped = serviceTypeMap[normalizeKey(key)];
      if (mapped) return mapped;
    }

    return found?.label ?? humanize(key);
  };

  const getCleaningTypeLabel = (key?: string | null) => {
    if (!key) return '';

    let found = cleaningTypes?.find((ct) => ct.key === key);
    if (!found) {
      const normalizedKey = normalizeKey(key);
      found = cleaningTypes?.find((ct) => normalizeKey(ct.key) === normalizedKey);
    }

    if (!found) {
      const cleaningTypeMap: Record<string, string> = {
        airbnb: 'Airbnb',
        check_in_check_out: 'Check-in/Check-out',
        checkin_checkout: 'Check-in/Check-out',
        standard_cleaning: 'Standard',
        deep_cleaning: 'Deep Clean',
        commercial_cleaning: 'Commercial',
        end_of_tenancy: 'End of Tenancy',
        move_in_move_out: 'Move In/Out',
      };
      const mapped = cleaningTypeMap[normalizeKey(key)];
      if (mapped) return mapped;
    }

    return found?.label ?? humanize(key);
  };

  const getServiceBadgeColor = (serviceType: string) => {
    return serviceTypes ? getBadgeColor(serviceType, serviceTypes) : 'bg-gray-500 text-white';
  };

  return { getServiceTypeLabel, getCleaningTypeLabel, getServiceBadgeColor };
}

export function getPastCleanerName(booking: {
  cleaners?: { first_name: string; last_name: string } | null;
}) {
  if (booking.cleaners) {
    return `${booking.cleaners.first_name} ${booking.cleaners.last_name}`;
  }
  return 'Unassigned';
}
