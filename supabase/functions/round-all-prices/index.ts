import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting to round all prices...');

    // Round prices in bookings table
    const { data: bookingsData, error: bookingsError } = await supabase.rpc('round_bookings_prices');
    
    if (bookingsError) {
      console.error('Error rounding bookings prices:', bookingsError);
      throw bookingsError;
    }

    // Round prices in past_bookings table
    const { data: pastBookingsData, error: pastBookingsError } = await supabase.rpc('round_past_bookings_prices');
    
    if (pastBookingsError) {
      console.error('Error rounding past_bookings prices:', pastBookingsError);
      throw pastBookingsError;
    }

    console.log('Successfully rounded all prices');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'All prices have been rounded to 2 decimal places',
        bookingsUpdated: bookingsData,
        pastBookingsUpdated: pastBookingsData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in round-all-prices function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
