import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, message, customer_id, customer_name } = await req.json();
    
    console.log('Sending SMS reply to:', to);

    if (!to || !message) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: to and message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Twilio credentials
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!accountSid || !authToken || !fromNumber) {
      console.error('Missing Twilio credentials');
      return new Response(
        JSON.stringify({ success: false, error: 'Missing Twilio credentials' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format phone number
    let formattedTo = to;
    if (!formattedTo.startsWith('+')) {
      // Assume UK number if no country code
      if (formattedTo.startsWith('0')) {
        formattedTo = '+44' + formattedTo.slice(1);
      } else {
        formattedTo = '+' + formattedTo;
      }
    }

    // Send SMS via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const auth = btoa(`${accountSid}:${authToken}`);

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: formattedTo,
        From: fromNumber,
        Body: message,
      }),
    });

    const twilioData = await response.json();
    console.log('Twilio response:', twilioData);

    if (!response.ok) {
      throw new Error(twilioData.message || 'Failed to send SMS');
    }

    // Save outgoing message to database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    await supabase
      .from('sms_conversations')
      .insert({
        phone_number: formattedTo,
        customer_id: customer_id || null,
        customer_name: customer_name || null,
        direction: 'outgoing',
        message: message,
        status: 'sent',
        twilio_sid: twilioData.sid,
      });

    console.log('SMS sent and saved successfully');

    return new Response(
      JSON.stringify({ success: true, sid: twilioData.sid }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending SMS:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
