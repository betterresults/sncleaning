import { format, isToday, isYesterday } from 'date-fns';

export function formatMessageTime(dateStr: string) {
  const date = new Date(dateStr);
  if (isToday(date)) {
    return format(date, 'HH:mm');
  }
  if (isYesterday(date)) {
    return `Yesterday ${format(date, 'HH:mm')}`;
  }
  return format(date, 'dd/MM/yyyy HH:mm');
}

export function formatThreadTime(dateStr: string) {
  const date = new Date(dateStr);
  if (isToday(date)) {
    return format(date, 'HH:mm');
  }
  if (isYesterday(date)) {
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
