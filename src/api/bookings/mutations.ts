import { supabase } from '@/integrations/supabase/client';
import { tryDeleteBookingGoogleCalendar, trySyncBookingGoogleCalendar } from '@/lib/googleCalendarSync';

export async function cancelBooking(bookingId: number): Promise<void> {
  const { error } = await supabase
    .from('bookings')
    .update({ booking_status: 'cancelled' })
    .eq('id', bookingId);

  if (error) {
    throw error;
  }

  await trySyncBookingGoogleCalendar(bookingId, 'booking cancellation');

  // Allow DB trigger to move booking to past_bookings
  await new Promise((resolve) => setTimeout(resolve, 1000));
}

export async function deleteBooking(bookingId: number): Promise<void> {
  const { data: bookingData } = await supabase
    .from('bookings')
    .select('*, customers(first_name, last_name, email)')
    .eq('id', bookingId)
    .single();

  await tryDeleteBookingGoogleCalendar(bookingId, 'booking deletion');

  const { error } = await supabase.from('bookings').delete().eq('id', bookingId);

  if (error) {
    throw error;
  }

  if (bookingData) {
    await supabase.from('activity_logs').insert({
      action_type: 'booking_deleted',
      entity_type: 'booking',
      entity_id: bookingId.toString(),
      user_role: 'admin',
      details: {
        booking_id: bookingId,
        customer_name: bookingData.customers
          ? `${bookingData.customers.first_name} ${bookingData.customers.last_name}`
          : `${bookingData.first_name} ${bookingData.last_name}`,
        customer_email: bookingData.customers?.email || bookingData.email,
        booking_date: bookingData.date_time,
        service_type: bookingData.service_type,
        address: bookingData.address,
      },
    });
  }
}

export async function deletePastBooking(bookingId: number): Promise<void> {
  const { data: bookingData } = await supabase
    .from('past_bookings')
    .select('*')
    .eq('id', bookingId)
    .single();

  const { error } = await supabase.from('past_bookings').delete().eq('id', bookingId);

  if (error) {
    throw error;
  }

  if (bookingData) {
    await supabase.from('activity_logs').insert({
      action_type: 'booking_deleted',
      entity_type: 'past_booking',
      entity_id: bookingId.toString(),
      user_role: 'admin',
      details: {
        booking_id: bookingId,
        customer_name: `${bookingData.first_name} ${bookingData.last_name}`,
        customer_email: bookingData.email,
        booking_date: bookingData.date_time,
        service_type: bookingData.service_type,
        address: bookingData.address,
      },
    });
  }
}
