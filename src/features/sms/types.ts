export interface Customer {
  id: number;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
}

export interface SMSConversation {
  id: string;
  phone_number: string;
  customer_id: number | null;
  customer_name: string | null;
  direction: 'incoming' | 'outgoing';
  message: string;
  status: string;
  created_at: string;
  read_at: string | null;
}

export interface ConversationThread {
  phone_number: string;
  customer_id: number | null;
  customer_name: string | null;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  messages: SMSConversation[];
}

export interface CustomerLookupResult {
  customer: {
    id: number;
    full_name: string | null;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  quoteLead: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    postcode: string | null;
    service_type: string | null;
    frequency: string | null;
    calculated_quote: number | null;
    recommended_hours: number | null;
    selected_date: string | null;
    status: string | null;
    created_at: string | null;
  } | null;
  bookings: Array<{
    id: number;
    service_type: string | null;
    date_time: string | null;
    address: string | null;
    postcode: string | null;
    total_cost: number | null;
    total_hours: number | null;
    booking_status: string | null;
  }>;
  smsConversations: Array<{
    id: string;
    message: string;
    direction: string;
    created_at: string;
    status: string;
  }>;
  emails: Array<{
    id: string;
    subject: string;
    status: string;
    created_at: string;
    notification_type: string;
  }>;
}
