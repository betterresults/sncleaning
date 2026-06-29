import type { BookingListItem } from '@/api/bookings';

export type Booking = BookingListItem;

export interface BookingsListFilters {
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

export const defaultBookingsListFilters: BookingsListFilters = {
  searchTerm: '',
  dateFrom: '',
  dateTo: '',
  cleanerId: 'all',
  paymentMethod: 'all',
  paymentStatus: 'all',
  serviceType: 'all',
  cleaningType: 'all',
  bookingStatus: 'all',
  customerSource: 'all',
};

export interface BookingsListViewProps {
  dashboardDateFilter?: {
    dateFrom: string;
    dateTo: string;
  };
  initialCleanerFilter?: string;
  filterBySubmissionDate?: boolean;
  showPagination?: boolean;
  maxItems?: number;
  openBookingId?: number;
}

export interface BookingsListCardHandlers {
  onEdit: (bookingId: number) => void;
  onDuplicate: (booking: Booking) => void;
  onAssignCleaner: (bookingId: number) => void;
  onMakeRecurring: (booking: Booking) => void;
  onSendEmail: (booking: Booking) => void;
  onViewInvoice: (booking: Booking) => void;
  onSetSource: (booking: Booking) => void;
  onPaymentAction: (booking: Booking) => void;
  onCancel: (bookingId: number) => void;
  onDelete: (bookingId: number) => void;
  onRefresh: () => void;
}
