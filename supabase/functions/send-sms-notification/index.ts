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
  
  console.log('formatPhoneNumber input:', phone, '-> cleaned:', cleaned);
  
  // Remove any leading + for processing
  const hasPlus = cleaned.startsWith('+');
  let digits = cleaned.replace(/^\+/, '');
  
  // Fix corrupted UK numbers where 44 was added multiple times
  // e.g., 444479395338 -> 447939533800 (original was 07939533800, got 44 added twice)
  // Pattern: 4444 followed by 7,8,9 at start indicates double country code
  while (digits.match(/^4444[789]/)) {
    // Remove one occurrence of 44
    digits = digits.substring(2);
    console.log('Removed duplicate 44 prefix, now:', digits);
  }
  
  // Now handle standard formats
  // If starts with 0 (UK local format like 07939...)
  if (digits.startsWith('0')) {
    // Remove leading 0 and add 44
    digits = '44' + digits.substring(1);
  }
  // If doesn't start with country code, assume UK
  else if (!digits.startsWith('44') && !digits.startsWith('1') && digits.length >= 10) {
    // Check if it's a UK mobile pattern (starts with 7, 8, 9 for mobiles)
    if (digits.match(/^[789]/)) {
      digits = '44' + digits;
    }
  }
  // Handle 0044 prefix
  else if (digits.startsWith('0044')) {
    digits = '44' + digits.substring(4);
  }
  
  // Validate UK number length (should be 12 digits: 44 + 10 digit number)
  if (digits.startsWith('44') && digits.length < 12) {
    console.warn('UK phone number appears incomplete:', digits, 'length:', digits.length);
  }
  
  const result = '+' + digits;
  console.log('formatPhoneNumber result:', result);
  return result;
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
