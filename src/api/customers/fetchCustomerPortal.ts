import { supabase } from '@/integrations/supabase/client';
import type {
  CustomerOverdueInvoice,
  CustomerUpcomingBooking,
  CustomerUpcomingBookingsData,
} from './types';

export async function fetchCustomerPaymentMethodsList(customerId: number) {
  const { data, error } = await supabase
    .from('customer_payment_methods')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function fetchCustomerIsBusinessClient(customerId: number): Promise<boolean> {
  const { data, error } = await supabase
    .from('customers')
    .select('clent_type')
    .eq('id', customerId)
    .single();

  if (error) {
    throw error;
  }

  return data?.clent_type === 'business';
}

export async function fetchCustomerOverdueInvoices(
  customerId: number,
): Promise<CustomerOverdueInvoice[]> {
  const { data, error } = await supabase
    .from('past_bookings')
    .select('*')
    .eq('customer', customerId)
    .not('invoice_link', 'is', null)
    .not('payment_status', 'ilike', '%paid%');

  if (error) {
    throw error;
  }

  const now = new Date();
  return (data || []).filter((booking) => {
    const bookingDate = new Date(booking.date_time);
    const dueDate = new Date(bookingDate);
    dueDate.setDate(dueDate.getDate() + 8);
    return now > dueDate;
  });
}

export async function fetchCustomerUpcomingBookings(
  customerId: number,
): Promise<CustomerUpcomingBookingsData> {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      id,
      date_time,
      address,
      postcode,
      cleaning_type,
      service_type,
      total_hours,
      total_cost,
      cleaning_cost_per_hour,
      booking_status,
      payment_status,
      additional_details,
      property_details,
      parking_details,
      key_collection,
      access,
      first_name,
      last_name,
      phone_number,
      email,
      same_day,
      linen_management,
      linen_used,
      created_by_user_id,
      created_by_source,
      cleaner:cleaners(first_name, last_name)
    `)
    .eq('customer', customerId)
    .gte('date_time', new Date().toISOString())
    .or('booking_status.is.null,booking_status.neq.cancelled')
    .order('date_time', { ascending: true });

  if (error) {
    throw error;
  }

  const bookings: CustomerUpcomingBooking[] = (data || []).map((booking) => ({
    ...booking,
    service_type: booking.service_type,
    linen_management: booking.linen_management || false,
    linen_used: booking.linen_used || [],
  }));

  const { count, error: countError } = await supabase
    .from('past_bookings')
    .select('*', { count: 'exact', head: true })
    .eq('customer', customerId);

  if (countError) {
    throw countError;
  }

  const { count: unpaidCount, error: unpaidCountError } = await supabase
    .from('past_bookings')
    .select('*', { count: 'exact', head: true })
    .eq('customer', customerId)
    .or(
      'payment_status.ilike.%unpaid%,payment_status.ilike.%collecting%,payment_status.ilike.%outstanding%,payment_status.ilike.%pending%,payment_status.is.null',
    );

  if (unpaidCountError) {
    throw unpaidCountError;
  }

  return {
    bookings,
    completedBookingsCount: count || 0,
    unpaidCompletedBookingsCount: unpaidCount || 0,
  };
}
