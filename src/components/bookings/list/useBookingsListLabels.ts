import { useServiceTypes, getServiceTypeBadgeColor as getBadgeColor } from '@/hooks/useCompanySettings';

function humanize(val?: string | null) {
  if (!val) return '';
  return val
    .split('_')
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ');
}

export function useBookingsListLabels() {
  const { data: serviceTypes } = useServiceTypes();

  const getServiceTypeLabel = (key?: string | null) => {
    if (!key) return '';
    const found = serviceTypes?.find((st) => st.key === key);
    return found?.label ?? humanize(key);
  };

  const getServiceBadgeColor = (serviceType: string) => {
    return serviceTypes ? getBadgeColor(serviceType, serviceTypes) : 'bg-gray-500 text-white';
  };

  return { getServiceTypeLabel, getServiceBadgeColor };
}

export function getCleanerName(booking: { cleaners?: { first_name: string; last_name: string } | null }) {
  if (booking.cleaners) {
    return `${booking.cleaners.first_name} ${booking.cleaners.last_name}`;
  }
  return 'Unassigned';
}
