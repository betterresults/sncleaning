import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bookingId } = await req.json();

    if (!bookingId) {
      return new Response(JSON.stringify({ success: false, error: 'Missing bookingId' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Only delete if booking payment_status is still unpaid/pending
    const { data: booking, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('id, payment_status, booking_status, recurring_group_id')
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      console.log('[cancel-unpaid-booking] Booking not found:', bookingId);
      return new Response(JSON.stringify({ success: true, message: 'Booking not found or already deleted' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const unpaidStatuses = ['Unpaid', 'unpaid', 'pending', 'Pending'];
    if (!unpaidStatuses.includes(booking.payment_status || '')) {
      console.log('[cancel-unpaid-booking] Booking already paid, not deleting:', booking.payment_status);
      return new Response(JSON.stringify({ success: false, error: 'Booking is already paid' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Delete associated recurring service if exists
    if (booking.recurring_group_id) {
      await supabaseAdmin
        .from('recurring_services')
        .delete()
        .eq('recurring_group_id', booking.recurring_group_id);
    }

    // Delete cleaner payments for this booking
    await supabaseAdmin
      .from('cleaner_payments')
      .delete()
      .eq('booking_id', bookingId);

    // Delete the booking
    const { error: deleteError } = await supabaseAdmin
      .from('bookings')
      .delete()
      .eq('id', bookingId);

    if (deleteError) {
      console.error('[cancel-unpaid-booking] Failed to delete booking:', deleteError);
      return new Response(JSON.stringify({ success: false, error: 'Failed to delete booking' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    console.log('[cancel-unpaid-booking] Successfully deleted unpaid booking:', bookingId);
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[cancel-unpaid-booking] Error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
