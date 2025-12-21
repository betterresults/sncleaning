import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Sabi's booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', 110798)
      .single();

    if (bookingError || !booking) {
      throw new Error(`Failed to fetch booking: ${bookingError?.message}`);
    }

    console.log('Found booking:', booking.id, booking.first_name, booking.frequently);

    // Fix hours_required to match total_hours
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ 
        hours_required: booking.total_hours,
        recommended_hours: 2 // The base hours before first deep clean
      })
      .eq('id', 110798);

    if (updateError) {
      console.error('Failed to update booking hours:', updateError);
    }

    // Check if recurring service already exists
    if (booking.recurring_group_id) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Booking already has a recurring group',
          recurringGroupId: booking.recurring_group_id
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create recurring service for weekly booking
    if (booking.frequently === 'weekly') {
      const recurringGroupId = crypto.randomUUID();
      
      // Get address ID for the customer
      const { data: addresses } = await supabase
        .from('addresses')
        .select('id')
        .eq('customer_id', booking.customer)
        .limit(1);

      const addressId = addresses?.[0]?.id || booking.address;

      // Determine day of week from booking date
      const bookingDate = new Date(booking.date_time);
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayOfWeek = days[bookingDate.getDay()];

      // Regular hours (base hours without first deep clean)
      const regularHours = 2; // From the query, hours_required was 2

      const recurringServiceData = {
        customer: booking.customer,
        address: addressId,
        cleaner: booking.cleaner,
        cleaner_rate: null,
        cleaning_type: 'Domestic',
        frequently: 'weekly',
        days_of_the_week: dayOfWeek,
        hours: String(regularHours),
        cost_per_hour: booking.cleaning_cost_per_hour || 22,
        total_cost: regularHours * (booking.cleaning_cost_per_hour || 22),
        payment_method: booking.payment_method,
        start_date: booking.date_only,
        start_time: booking.time_only ? `${booking.time_only}+00` : null,
        postponed: false,
        interval: '7',
        recurring_group_id: recurringGroupId,
        created_by_user_id: booking.created_by_user_id,
        created_by_source: booking.created_by_source || 'website'
      };

      console.log('Creating recurring service:', recurringServiceData);

      const { error: recurringError } = await supabase
        .from('recurring_services')
        .insert([recurringServiceData]);

      if (recurringError) {
        throw new Error(`Failed to create recurring service: ${recurringError.message}`);
      }

      // Update booking with recurring group ID
      const { error: updateBookingError } = await supabase
        .from('bookings')
        .update({ recurring_group_id: recurringGroupId })
        .eq('id', 110798);

      if (updateBookingError) {
        console.error('Failed to update booking with recurring group ID:', updateBookingError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Created recurring service for Sabi',
          recurringGroupId,
          dayOfWeek,
          regularHours
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Booking is not a weekly booking, no recurring service created',
        frequently: booking.frequently
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
