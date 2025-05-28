
export interface Booking {
  id: number;
  date_time: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address: string;
  postcode: string;
  form_name: string;
  total_cost: number;
  cleaner: number;
  customer: number;
  cleaner_pay: number;
  booking_status: string;
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
