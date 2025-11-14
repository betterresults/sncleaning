import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload = await req.json();
    console.log('Received Resend webhook:', JSON.stringify(payload));

    const eventType = payload.type;
    const emailData = payload.data;

    if (!emailData?.email_id) {
      console.log('No email_id in payload, skipping');
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    const deliveryId = emailData.email_id;

    // Update notification_logs based on event type
    switch (eventType) {
      case 'email.sent':
        console.log(`Email ${deliveryId} was sent`);
        await supabaseClient
          .from('notification_logs')
          .update({ 
            status: 'sent',
            sent_at: new Date().toISOString()
          })
          .eq('delivery_id', deliveryId);
        break;

      case 'email.delivered':
        console.log(`Email ${deliveryId} was delivered`);
        await supabaseClient
          .from('notification_logs')
          .update({ 
            status: 'delivered',
            delivered_at: new Date().toISOString()
          })
          .eq('delivery_id', deliveryId);
        break;

      case 'email.opened':
        console.log(`Email ${deliveryId} was opened`);
        await supabaseClient
          .from('notification_logs')
          .update({ 
            status: 'opened',
            opened_at: new Date().toISOString()
          })
          .eq('delivery_id', deliveryId);
        break;

      case 'email.bounced':
        console.log(`Email ${deliveryId} bounced`);
        await supabaseClient
          .from('notification_logs')
          .update({ 
            status: 'failed',
            error_message: emailData.bounce?.message || 'Email bounced'
          })
          .eq('delivery_id', deliveryId);
        break;

      case 'email.complained':
        console.log(`Email ${deliveryId} was marked as spam`);
        await supabaseClient
          .from('notification_logs')
          .update({ 
            status: 'failed',
            error_message: 'Marked as spam by recipient'
          })
          .eq('delivery_id', deliveryId);
        break;

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error: any) {
    console.error('Error in resend-webhook:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
