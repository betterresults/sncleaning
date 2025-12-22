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
    console.log('Twilio SMS webhook received');
    
    // Parse the form data from Twilio
    const formData = await req.formData();
    const from = formData.get('From') as string;
    const body = formData.get('Body') as string;
    const messageSid = formData.get('MessageSid') as string;
    
    console.log('Incoming SMS from:', from, 'Body:', body);

    if (!from || !body) {
      console.error('Missing required fields');
      return new Response('Missing required fields', { status: 400 });
    }

    // Initialize Supabase with service role for database access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Normalize phone number for lookup
    const normalizedPhone = from.replace(/^\+/, '');
    
    // Try to find customer by phone number
    const { data: customer } = await supabase
      .from('customers')
      .select('id, first_name, last_name, full_name, phone')
      .or(`phone.ilike.%${normalizedPhone.slice(-10)}%,whatsapp.ilike.%${normalizedPhone.slice(-10)}%`)
      .limit(1)
      .single();

    console.log('Found customer:', customer);

    // Save the incoming message
    const { error: insertError } = await supabase
      .from('sms_conversations')
      .insert({
        phone_number: from,
        customer_id: customer?.id || null,
        customer_name: customer?.full_name || customer?.first_name || null,
        direction: 'incoming',
        message: body,
        status: 'received',
        twilio_sid: messageSid,
      });

    if (insertError) {
      console.error('Error saving incoming SMS:', insertError);
      throw insertError;
    }

    console.log('Successfully saved incoming SMS');

    // Return TwiML response (empty response to not send auto-reply)
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'text/xml' 
        } 
      }
    );

  } catch (error) {
    console.error('Error processing Twilio webhook:', error);
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'text/xml' 
        } 
      }
    );
  }
});
