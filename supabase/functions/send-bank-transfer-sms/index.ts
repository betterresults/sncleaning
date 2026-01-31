import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendBankTransferSMSRequest {
  bookingId: number;
  phoneNumber: string;
  customerName: string;
  amount: number;
  bookingDate: string;
}

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Background task to send SMS after delay
async function sendSMSWithDelay(data: SendBankTransferSMSRequest) {
  const { bookingId, phoneNumber, customerName, amount, bookingDate } = data;
  
  // Wait 1 minute before sending to avoid message merging with booking confirmation
  console.log(`Waiting 1 minute before sending bank transfer SMS for booking ${bookingId}`);
  await delay(60000); // 60 seconds = 1 minute
  
  console.log(`Now sending bank transfer SMS for booking ${bookingId} to ${phoneNumber}`);

  // Get Twilio credentials from environment
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const twilioPhone = Deno.env.get('TWILIO_PHONE_NUMBER');

  if (!accountSid || !authToken || !twilioPhone) {
    console.error('Twilio credentials not configured');
    return;
  }

  // Init Supabase client for logs
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get bank transfer SMS template
  const { data: template, error: templateError } = await supabase
    .from('sms_templates')
    .select('content')
    .eq('name', 'Bank Transfer Details')
    .eq('is_active', true)
    .single();

  let message: string;
  
  if (template?.content) {
    // Use template and replace variables
    message = template.content
      .replace(/\{\{customer_name\}\}/g, customerName)
      .replace(/\{\{booking_date\}\}/g, bookingDate)
      .replace(/\{\{amount\}\}/g, amount.toFixed(2))
      .replace(/\{\{booking_id\}\}/g, bookingId.toString());
  } else {
    // Fallback message - simplified without redundant intro
    message = `Hi ${customerName}, to secure your booking for ${bookingDate}, please transfer £${amount.toFixed(2)} at least 48 hours before your appointment. Bank Details: Sort Code: 20-00-00, Account: 12345678, Ref: ${bookingId}. Thank you!`;
  }

  console.log('Bank transfer SMS message:', message);

  // Send SMS via Twilio
  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  
  const formData = new URLSearchParams();
  formData.append('To', phoneNumber);
  formData.append('From', twilioPhone);
  formData.append('Body', message);

  try {
    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const twilioData = await twilioResponse.json();

    if (!twilioResponse.ok) {
      console.error('Twilio error:', twilioData);
      return;
    }

    console.log('Bank transfer SMS sent successfully:', twilioData.sid);

    // Log the notification in the database
    await supabase.from('notification_logs').insert({
      entity_type: 'booking',
      entity_id: bookingId.toString(),
      recipient_email: phoneNumber,
      recipient_type: 'customer',
      status: 'sent',
      subject: 'Bank Transfer Details SMS',
      content: message,
      delivery_id: twilioData.sid,
      notification_type: 'sms',
    });
  } catch (error: any) {
    console.error('Error sending bank transfer SMS:', error);
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: SendBankTransferSMSRequest = await req.json();
    const { bookingId, phoneNumber } = requestData;

    console.log(`Scheduling bank transfer SMS for booking ${bookingId} to ${phoneNumber} (will send in 1 minute)`);

    // Use EdgeRuntime.waitUntil to run the SMS sending in the background after delay
    // This allows us to return immediately while the SMS is scheduled
    // @ts-ignore - EdgeRuntime is available in Supabase Edge Functions
    EdgeRuntime.waitUntil(sendSMSWithDelay(requestData));

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Bank transfer SMS scheduled (will send in 1 minute)'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in send-bank-transfer-sms:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
