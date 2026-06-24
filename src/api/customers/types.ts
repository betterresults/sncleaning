export interface CustomerUpcomingBooking {
  id: number;
  date_time: string;
  address: string;
  postcode: string;
  cleaning_type: string;
  service_type: string;
  total_hours: number;
  total_cost: number;
  cleaning_cost_per_hour: number | null;
  booking_status: string;
  payment_status: string;
  additional_details: string | null;
  property_details: string | null;
  parking_details: string | null;
  key_collection: string | null;
  access: string | null;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  email: string | null;
  same_day: boolean;
  linen_management: boolean;
  linen_used: unknown;
  created_by_user_id?: string | null;
  created_by_source?: string | null;
  cleaner?: {
    first_name: string;
    last_name: string;
  };
}

export interface CustomerUpcomingBookingsData {
  bookings: CustomerUpcomingBooking[];
  completedBookingsCount: number;
  unpaidCompletedBookingsCount: number;
}

export interface CustomerOverdueInvoice {
  id: number;
  date_time: string;
  invoice_link: string | null;
  payment_status: string;
  [key: string]: unknown;
}

export interface CustomerDetailProfile {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company: string;
  client_status: string;
  clent_type?: string;
  created_at: string;
}

export interface CustomerDetailPaymentMethod {
  id: string;
  stripe_payment_method_id: string;
  card_brand: string;
  card_last4: string;
  card_exp_month: number;
  card_exp_year: number;
  is_default: boolean;
}

export interface CustomerDetailBooking {
  id: number;
  date_time: string;
  address: string;
  postcode: string;
  total_cost: string | number;
  cleaning_type: string;
  booking_status: string;
  payment_status: string;
  cleaner_name?: string;
}

export interface CustomerDetailUnpaidItem {
  id: string;
  date_time: string;
  address: string;
  postcode: string;
  total_cost: number;
  cleaning_type: string;
  payment_status: string;
  source: 'past_booking' | 'linen_order';
}

export interface CustomerDetailData {
  customer: CustomerDetailProfile;
  paymentMethods: CustomerDetailPaymentMethod[];
  addresses: Array<{
    id: string | number;
    address: string;
    postcode: string;
    is_default?: boolean;
    access?: string;
    [key: string]: unknown;
  }>;
  upcomingBookings: CustomerDetailBooking[];
  pastBookings: CustomerDetailBooking[];
  unpaidBookings: CustomerDetailUnpaidItem[];
}
