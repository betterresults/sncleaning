export interface BookingsListParams {
  dashboardDateFilter?: {
    dateFrom: string;
    dateTo: string;
  };
  filterBySubmissionDate?: boolean;
  includeCleaners?: boolean;
}

export interface BookingListItem {
  id: number;
  date_time: string;
  time_only?: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address: string;
  postcode: string;
  cleaning_type: string;
  service_type: string;
  total_cost: number;
  payment_status: string;
  payment_method?: string;
  invoice_id?: string | null;
  invoice_link?: string | null;
  cleaner: number | null;
  customer: number;
  cleaner_pay: number | null;
  cleaner_rate?: number | null;
  total_hours: number | null;
  hours_required?: number | null;
  recommended_hours?: number | null;
  ironing_hours?: number | null;
  linen_management?: boolean;
  additional_details?: string;
  frequently?: string;
  booking_status?: string;
  has_photos?: boolean;
  same_day?: boolean;
  sub_cleaners_count?: number;
  sub_cleaners_total_pay?: number;
  customer_source?: string | null;
  property_details?: string | null;
  oven_size?: string | null;
  access?: string | null;
  cleaners?: {
    id: number;
    first_name: string;
    last_name: string;
  } | null;
  customers?: {
    id: number;
    first_name: string;
    last_name: string;
  } | null;
}

export interface CleanerOption {
  id: number;
  first_name: string;
  last_name: string;
}

export interface BookingsListData {
  bookings: BookingListItem[];
  cleaners: CleanerOption[];
  customerSourceMap: Record<number, string>;
  availableSources: string[];
}

export interface PastBookingsListParams {
  dashboardDateFilter?: {
    dateFrom: string;
    dateTo: string;
  };
  userRole?: string | null;
  userId?: string | null;
  assignedSources?: string[];
}

export interface PastBookingListItem {
  id: number;
  date_time: string;
  time_only?: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address: string;
  postcode: string;
  cleaning_type: string;
  service_type: string;
  total_cost: string;
  payment_status: string;
  payment_method?: string;
  invoice_id?: string | null;
  invoice_link?: string | null;
  cleaner: number | null;
  customer: number;
  cleaner_pay: number | null;
  total_hours: number | null;
  linen_management?: boolean;
  additional_details?: string;
  frequently?: string;
  booking_status?: string;
  property_details?: string;
  has_photos?: boolean;
  created_by_user_id?: string | null;
  cleaners?: {
    id: number;
    first_name: string;
    last_name: string;
  } | null;
  customers?: {
    id: number;
    first_name: string;
    last_name: string;
  } | null;
}

export interface PastBookingsListData {
  bookings: PastBookingListItem[];
  cleaners: CleanerOption[];
  customerSourceMap: Record<number, string>;
  availableSources: string[];
}

export interface UpcomingCalendarParams {
  dashboardDateFilter?: {
    dateFrom: string;
    dateTo: string;
  };
  sortOrder: 'asc' | 'desc';
  userRole?: string | null;
  userId?: string | null;
  assignedSources?: string[];
}

export interface UpcomingCalendarBooking extends BookingListItem {
  primary_cleaner?: {
    id: number;
    full_name: string;
  } | null;
  created_by_user_id?: string | null;
}

export interface UpcomingCalendarCustomer {
  id: number;
  first_name: string;
  last_name: string;
}

export interface UpcomingCalendarData {
  bookings: UpcomingCalendarBooking[];
  cleaners: Array<CleanerOption & { full_name?: string }>;
  customers: UpcomingCalendarCustomer[];
  customerSourceMap: Record<number, string>;
  availableSources: string[];
}
