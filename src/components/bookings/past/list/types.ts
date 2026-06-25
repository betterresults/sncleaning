import type { PastBookingListItem } from '@/api/bookings';

export type PastBooking = PastBookingListItem;

export interface PastBookingsListFilters {
  searchTerm: string;
  dateFrom: string;
  dateTo: string;
  cleanerId: string;
  paymentMethod: string;
  paymentStatus: string;
  serviceType: string;
  cleaningType: string;
  bookingStatus: string;
  customerSource: string;
}

export function defaultPastBookingsListFilters(
  showOnlyCancelled = false,
): PastBookingsListFilters {
  return {
    searchTerm: '',
    dateFrom: '',
    dateTo: '',
    cleanerId: 'all',
    paymentMethod: 'all',
    paymentStatus: 'all',
    serviceType: 'all',
    cleaningType: 'all',
    bookingStatus: showOnlyCancelled ? 'cancelled' : 'not_cancelled',
    customerSource: 'all',
  };
}

export interface PastBookingsListViewProps {
  dashboardDateFilter?: {
    dateFrom: string;
    dateTo: string;
  };
  showOnlyCancelled?: boolean;
  showStatsForAdmin?: boolean;
  openBookingId?: number;
}

export interface PastBookingsListCardHandlers {
  onEdit: (bookingId: number) => void;
  onDuplicate: (booking: PastBooking) => void;
  onAssignCleaner: (bookingId: number) => void;
  onMakeRecurring: (booking: PastBooking) => void;
  onSendEmail: (booking: PastBooking) => void;
  onPhotoManagement: (booking: PastBooking) => void;
  onPaymentAction: (booking: PastBooking) => void;
  onDelete: (bookingId: number) => void;
}
