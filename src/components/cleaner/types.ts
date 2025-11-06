
export interface Booking {
  id: number;
  date_time: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address: string;
  postcode: string;
  cleaning_type: string;
  service_type: string;
  total_cost: number;
  cleaner: number;
  customer: number;
  cleaner_pay: number;
  booking_status: string;
  total_hours?: number;
  hours_required?: number;
  additional_details?: string;
  property_details?: string;
  frequently?: string;
  first_cleaning?: string;
  occupied?: string;
  exclude_areas?: string;
  extras?: string;
  key_collection?: string;
  access?: string;
  parking_details?: string;
  same_day?: boolean;
  has_photos?: boolean;
  cleaners?: {
    id: number;
    first_name: string;
    last_name: string;
    full_name: string;
  };
}

export interface Stats {
  totalBookings: number;
  totalEarnings: number;
}
