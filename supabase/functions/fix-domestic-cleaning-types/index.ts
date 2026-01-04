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

    // Find all domestic bookings where cleaning_type is incorrectly set to check-in/check-out or Standard Cleaning
    // but should show the frequency (weekly, biweekly, monthly, onetime) or Deep Cleaning
    const { data: bookingsToFix, error: fetchError } = await supabase
      .from('bookings')
      .select('id, service_type, cleaning_type, frequently, additional_details')
      .or('service_type.eq.Domestic,service_type.eq.Domestic Cleaning')
      .in('cleaning_type', ['checkin-checkout', 'check-in-checkout', 'check_in_check_out', 'standard_cleaning', 'Standard Cleaning', 'Domestic']);

    if (fetchError) {
      throw new Error(`Failed to fetch bookings: ${fetchError.message}`);
    }

    console.log(`Found ${bookingsToFix?.length || 0} domestic bookings to fix`);

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

      // For domestic: cleaning_type should be the frequency OR "Deep Cleaning" if deep clean selected
      // Use the frequently field value, fallback to 'onetime' if not set
      const newCleaningType = isDeepClean ? 'Deep Cleaning' : (booking.frequently || 'onetime');

      const { error: updateError } = await supabase
        .from('bookings')
        .update({ cleaning_type: newCleaningType })
        .eq('id', booking.id);

      if (updateError) {
        results.push({ id: booking.id, success: false, error: updateError.message });
      } else {
        console.log(`Fixed booking ${booking.id}: cleaning_type "${booking.cleaning_type}" -> "${newCleaningType}"`);
        results.push({ 
          id: booking.id, 
          success: true, 
          oldCleaningType: booking.cleaning_type,
          newCleaningType,
          frequently: booking.frequently
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
