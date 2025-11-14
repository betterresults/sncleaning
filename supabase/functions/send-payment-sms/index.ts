import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendSMSRequest {
  bookingId: number;
  phoneNumber: string;
  customerName: string;
  amount: number;
  paymentLink?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bookingId, phoneNumber, customerName, amount, paymentLink }: SendSMSRequest = await req.json();

    console.log(`Sending payment SMS for booking ${bookingId} to ${phoneNumber}`);

    // Get Twilio credentials from environment
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhone = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!accountSid || !authToken || !twilioPhone) {
      throw new Error('Twilio credentials not configured');
    }

    // Init Supabase client for lookups/logs
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Resolve payment link: prefer provided, else fetch from DB
    let finalPaymentLink = paymentLink || '';

    // Try bookings.invoice_link
    if (!finalPaymentLink) {
      const { data: bInv } = await supabase
        .from('bookings')
        .select('invoice_link')
        .eq('id', bookingId)
        .maybeSingle();
      if (bInv?.invoice_link) finalPaymentLink = bInv.invoice_link;
    }

    // Try past_bookings.invoice_link
    if (!finalPaymentLink) {
      const { data: pInv } = await supabase
        .from('past_bookings')
        .select('invoice_link')
        .eq('id', bookingId)
        .maybeSingle();
      if (pInv?.invoice_link) finalPaymentLink = pInv.invoice_link;
    }

    // Create concise SMS message
    const message = finalPaymentLink
      ? `Hi ${customerName}, invoice for £${amount.toFixed(2)} has been sent by email from SN Cleaning Services. If you don't see it, please check the spam folder. You can also pay here: ${finalPaymentLink}\n\nThank you,\nSN Cleaning Team`
      : `Hi ${customerName}, invoice for £${amount.toFixed(2)} has been sent by email from SN Cleaning Services. If you don't see it, please check the spam folder.\n\nThank you,\nSN Cleaning Team`;

    console.log('SMS message:', message);

    // Send SMS via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    
    const formData = new URLSearchParams();
    formData.append('To', phoneNumber);
    formData.append('From', twilioPhone);
    formData.append('Body', message);

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
      throw new Error(twilioData.message || 'Failed to send SMS');
    }

    console.log('SMS sent successfully:', twilioData.sid);

    // Log the notification in the database
    // Supabase client already initialized above

    // Insert notification log with notification_type
    await supabase.from('notification_logs').insert({
      entity_type: 'booking',
      entity_id: bookingId.toString(),
      recipient_email: phoneNumber,
      recipient_type: 'customer',
      status: 'sent',
      subject: 'Payment Reminder SMS',
      content: message,
      delivery_id: twilioData.sid,
      notification_type: 'sms',
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageSid: twilioData.sid,
        message: 'SMS sent successfully'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in send-payment-sms:', error);
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
