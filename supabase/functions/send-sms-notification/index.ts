import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SMSRequest {
  to: string;
  message: string;
  from?: string;
}

// Format phone number to E.164 international format
function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters except leading +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // Fix corrupted UK numbers where +44 was added to number already starting with 44
  // e.g., +444479561682 should be +447956168X (user entered 447956... and +44 was added)
  // Pattern: +4444 followed by 7,8,9 indicates double country code
  if (cleaned.match(/^\+4444[789]/)) {
    // +444479561682 -> +4479561682 (remove first 44 after +)
    cleaned = '+' + cleaned.substring(3);
  }
  // Handle UK numbers starting with 07 (mobile) or 01/02 (landline)
  else if (cleaned.startsWith('07') || cleaned.startsWith('01') || cleaned.startsWith('02')) {
    // Remove leading 0 and add +44
    cleaned = '+44' + cleaned.substring(1);
  } 
  // Handle numbers starting with 44 (UK without +)
  else if (cleaned.startsWith('44') && !cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  // Handle numbers starting with 0044 (UK international dialing)
  else if (cleaned.startsWith('0044')) {
    cleaned = '+44' + cleaned.substring(4);
  }
  // If no + prefix, add it
  else if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  
  return cleaned;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const { to, message, from }: SMSRequest = await req.json();

    // Get Twilio credentials from environment
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!accountSid || !authToken || !twilioPhoneNumber) {
      console.error('Missing Twilio credentials');
      return new Response(
        JSON.stringify({ error: 'Twilio credentials not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    if (!to || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, message' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Format phone number to proper E.164 format
    const formattedTo = formatPhoneNumber(to);
    const fromNumber = from || twilioPhoneNumber;

    console.log(`Original phone: ${to}`);
    console.log(`Formatted phone: ${formattedTo}`);
    console.log(`Sending SMS to ${formattedTo} from ${fromNumber}`);
    console.log(`Message: ${message}`);

    // Prepare Twilio API request
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    
    const credentials = btoa(`${accountSid}:${authToken}`);
    
    const body = new URLSearchParams({
      To: formattedTo,
      From: fromNumber,
      Body: message
    });

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString()
    });

    const twilioResponse = await response.json();

    if (!response.ok) {
      console.error('Twilio API error:', twilioResponse);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send SMS',
          details: twilioResponse 
        }),
        { status: response.status, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log('SMS sent successfully:', twilioResponse.sid);

    return new Response(
      JSON.stringify({
        success: true,
        messageId: twilioResponse.sid,
        status: twilioResponse.status,
        to: twilioResponse.to,
        from: twilioResponse.from
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );

  } catch (error) {
    console.error('Error sending SMS:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

serve(handler);
