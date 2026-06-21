import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId } = await req.json().catch(() => ({}));
    const cleanSessionId = typeof sessionId === 'string' ? sessionId.trim() : '';

    if (!cleanSessionId || !cleanSessionId.startsWith('cs_')) {
      return new Response(JSON.stringify({ success: false, error: 'Valid sessionId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('id')
      .eq('stripe_checkout_session_id', cleanSessionId)
      .maybeSingle();

    if (booking?.id) {
      return new Response(JSON.stringify({ success: true, bookingId: booking.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: quoteLead } = await supabaseAdmin
      .from('quote_leads')
      .select('converted_booking_id')
      .eq('stripe_checkout_session_id', cleanSessionId)
      .maybeSingle();

    return new Response(JSON.stringify({
      success: true,
      bookingId: quoteLead?.converted_booking_id || null,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[resolve-checkout-booking] Error', err);
    return new Response(JSON.stringify({ success: false, error: err?.message || String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);