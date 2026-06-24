import type {
  CustomerDetailBooking,
  CustomerDetailData,
  CustomerDetailPaymentMethod,
  CustomerDetailProfile,
  CustomerDetailUnpaidItem,
} from '@/api/customers';

export interface CustomerDetailViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: number | null;
  customerName?: string;
  customerEmail?: string;
}

export type CustomerDetailCustomer = CustomerDetailProfile;
export type CustomerDetailUnpaidBooking = CustomerDetailUnpaidItem;
export type CustomerDetailPayment = CustomerDetailPaymentMethod;
export type CustomerDetailBookingItem = CustomerDetailBooking;
export type CustomerDetailAddressItem = CustomerDetailData['addresses'][number];

export interface CustomerDetailOverviewTabProps {
  customer: CustomerDetailCustomer;
  paymentMethodsCount: number;
  upcomingBookingsCount: number;
  pastBookingsCount: number;
  addressesCount: number;
  totalUnpaid: number;
  onSave: (data: Partial<CustomerDetailCustomer>) => Promise<void>;
}

export interface CustomerDetailPaymentsTabProps {
  paymentMethods: CustomerDetailPayment[];
  unpaidBookings: CustomerDetailUnpaidBooking[];
  totalUnpaid: number;
  onAddCard: () => void;
  onChargeNow: () => void;
  onDeletePaymentMethod: (paymentMethodId: string) => void;
  onSetDefaultPaymentMethod: (paymentMethodId: string) => void;
}

export interface CustomerDetailUpcomingTabProps {
  bookings: CustomerDetailBookingItem[];
}

export interface CustomerDetailHistoryTabProps {
  bookings: CustomerDetailBookingItem[];
}

export interface CustomerDetailAddressesTabProps {
  addresses: CustomerDetailAddressItem[];
}
