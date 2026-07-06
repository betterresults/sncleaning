import { format, isSameDay, subDays } from 'date-fns';
import { getLondonWallClockDate, getUKNowAsLocalDate } from '@/lib/ukTime';

export function formatMessageTime(dateStr: string) {
  const date = getLondonWallClockDate(dateStr);
  if (!date) return '';
  const ukNow = getUKNowAsLocalDate();
  if (isSameDay(date, ukNow)) {
    return format(date, 'HH:mm');
  }
  if (isSameDay(date, subDays(ukNow, 1))) {
    return `Yesterday ${format(date, 'HH:mm')}`;
  }
  return format(date, 'dd/MM/yyyy HH:mm');
}

export function formatThreadTime(dateStr: string) {
  const date = getLondonWallClockDate(dateStr);
  if (!date) return '';
  const ukNow = getUKNowAsLocalDate();
  if (isSameDay(date, ukNow)) {
    return format(date, 'HH:mm');
  }
  if (isSameDay(date, subDays(ukNow, 1))) {
    return 'Yesterday';
  }
  return format(date, 'dd/MM');
}

export function getInitials(name: string | null, phone: string) {
  if (name) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
  return phone.slice(-2);
}

export function getCustomerDisplayName(customer: {
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
}) {
  return (
    customer.full_name ||
    `${customer.first_name || ''} ${customer.last_name || ''}`.trim() ||
    'Unknown'
  );
}
