import type { PastBookingListItem } from '@/api/bookings';
import type { PastBookingsListFilters } from './types';

export function applyPastBookingsListFilters(
  bookings: PastBookingListItem[],
  filters: PastBookingsListFilters,
  customerSourceMap: Record<number, string>,
): PastBookingListItem[] {
  let filtered = [...bookings];

  // `filters.dateFrom`/`dateTo` are bare `YYYY-MM-DD` strings; build them into
  // `date_time`-style boundary strings (naive UK digits + fake `+00:00`) so the
  // comparison stays in the same naive-UK-frame convention as `booking.date_time`.
  if (filters.dateFrom) {
    const fromBoundary = new Date(`${filters.dateFrom}T00:00:00+00:00`);
    filtered = filtered.filter(
      (booking) => new Date(booking.date_time) >= fromBoundary,
    );
  }
  if (filters.dateTo) {
    const toBoundary = new Date(`${filters.dateTo}T23:59:59.999+00:00`);
    filtered = filtered.filter(
      (booking) => new Date(booking.date_time) <= toBoundary,
    );
  }

  if (filters.cleanerId && filters.cleanerId !== 'all') {
    filtered = filtered.filter(
      (booking) => booking.cleaner === parseInt(filters.cleanerId, 10),
    );
  }

  if (filters.paymentMethod && filters.paymentMethod !== 'all') {
    filtered = filtered.filter(
      (booking) => booking.payment_method === filters.paymentMethod,
    );
  }

  if (filters.paymentStatus && filters.paymentStatus !== 'all') {
    filtered = filtered.filter(
      (booking) => booking.payment_status === filters.paymentStatus,
    );
  }

  if (filters.serviceType && filters.serviceType !== 'all') {
    filtered = filtered.filter(
      (booking) => booking.service_type === filters.serviceType,
    );
  }

  if (filters.cleaningType && filters.cleaningType !== 'all') {
    filtered = filtered.filter(
      (booking) => booking.cleaning_type === filters.cleaningType,
    );
  }

  if (filters.bookingStatus && filters.bookingStatus !== 'all') {
    if (filters.bookingStatus === 'not_cancelled') {
      filtered = filtered.filter((booking) => {
        const status = booking.booking_status?.toLowerCase();
        return status !== 'cancelled' && status !== 'canceled';
      });
    } else if (filters.bookingStatus === 'cancelled') {
      filtered = filtered.filter((booking) => {
        const status = booking.booking_status?.toLowerCase();
        return status === 'cancelled' || status === 'canceled';
      });
    } else {
      filtered = filtered.filter(
        (booking) => booking.booking_status === filters.bookingStatus,
      );
    }
  }

  if (filters.searchTerm) {
    const searchLower = filters.searchTerm.toLowerCase();
    filtered = filtered.filter(
      (booking) =>
        `${booking.first_name} ${booking.last_name}`.toLowerCase().includes(searchLower) ||
        booking.email.toLowerCase().includes(searchLower) ||
        booking.phone_number?.toLowerCase().includes(searchLower) ||
        booking.address?.toLowerCase().includes(searchLower) ||
        booking.postcode?.toLowerCase().includes(searchLower),
    );
  }

  if (filters.customerSource && filters.customerSource !== 'all') {
    filtered = filtered.filter((booking) => {
      const customerId = booking.customer;
      return customerId && customerSourceMap[customerId] === filters.customerSource;
    });
  }

  return filtered;
}
