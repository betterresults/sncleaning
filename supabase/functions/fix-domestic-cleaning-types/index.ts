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

    // Find all domestic bookings with incorrect cleaning_type values
    const { data: bookingsToFix, error: fetchError } = await supabase
      .from('bookings')
      .select('id, service_type, cleaning_type, frequently, additional_details')
      .or('service_type.ilike.%domestic%')
      .in('cleaning_type', ['weekly', 'fortnightly', 'onetime', 'checkin-checkout', 'monthly', 'biweekly', 'one-time']);

    if (fetchError) {
      throw new Error(`Failed to fetch bookings: ${fetchError.message}`);
    }

    console.log(`Found ${bookingsToFix?.length || 0} bookings to fix`);

    const results: any[] = [];

    for (const booking of bookingsToFix || []) {
      // Determine if it's a deep clean based on additional_details
      let isDeepClean = false;
      if (booking.additional_details) {
        try {
          const details = typeof booking.additional_details === 'string' 
            ? JSON.parse(booking.additional_details) 
            : booking.additional_details;
          isDeepClean = details?.firstDeepClean?.enabled === true;
        } catch (e) {
          // Ignore parse errors
        }
      }

      const newCleaningType = isDeepClean ? 'Deep Cleaning' : 'Standard Cleaning';
      
      // The old cleaning_type was actually the frequency, so copy it to frequently if not set
      const newFrequently = booking.frequently || booking.cleaning_type;

      const { error: updateError } = await supabase
        .from('bookings')
        .update({ 
          cleaning_type: newCleaningType,
          frequently: newFrequently,
          service_type: 'Domestic'
        })
        .eq('id', booking.id);

      if (updateError) {
        results.push({ id: booking.id, success: false, error: updateError.message });
      } else {
        results.push({ 
          id: booking.id, 
          success: true, 
          oldCleaningType: booking.cleaning_type,
          newCleaningType,
          newFrequently 
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Fixed ${successCount} bookings, ${failCount} failures`,
        totalFound: bookingsToFix?.length || 0,
        results
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error fixing domestic cleaning types:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
