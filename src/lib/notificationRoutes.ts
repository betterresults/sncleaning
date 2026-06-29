import type { Notification } from '@/hooks/useNotifications';

function parseEntityId(value?: string | number | null): number | undefined {
  if (value == null || value === '') return undefined;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function resolveNotificationIds(notification: Notification) {
  const bookingId =
    notification.bookingId ??
    (notification.entityType === 'booking' || notification.entityType === 'past_booking'
      ? parseEntityId(notification.entityId)
      : undefined);

  const customerId =
    notification.customerId ??
    (notification.entityType === 'customer' ? parseEntityId(notification.entityId) : undefined);

  return { bookingId, customerId };
}

/** Returns the admin route for a notification, or null if none applies. */
export function getNotificationRoute(notification: Notification): string | null {
  const { bookingId, customerId } = resolveNotificationIds(notification);

  switch (notification.type) {
    case 'booking':
      if (notification.actionType === 'booking_cancelled') {
        return '/cancelled-bookings';
      }
      if (notification.actionType === 'booking_deleted') {
        return '/admin-activity-logs';
      }
      if (
        notification.actionType === 'booking_status_changed' &&
        notification.newStatus === 'completed'
      ) {
        return bookingId ? `/past-bookings?bookingId=${bookingId}` : '/past-bookings';
      }
      return bookingId ? `/upcoming-bookings?bookingId=${bookingId}` : '/upcoming-bookings';

    case 'customer':
      return customerId ? `/users/customers?customerId=${customerId}` : '/users/customers';

    case 'payment':
      return bookingId
        ? `/admin-payment-management?bookingId=${bookingId}`
        : '/admin-payment-management';

    default:
      return '/admin-activity-logs';
  }
}
