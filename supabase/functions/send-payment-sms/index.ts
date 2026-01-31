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
  messageType?: 'invoice' | 'payment_method_collection';
  bookingDate?: string;
  bookingTime?: string;
  totalHours?: number;
  customerId?: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bookingId, phoneNumber, customerName, amount, paymentLink, messageType = 'invoice', bookingDate, bookingTime, totalHours, customerId }: SendSMSRequest = await req.json();

    console.log(`Sending ${messageType} SMS for booking ${bookingId} to ${phoneNumber}`);

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

    // Resolve payment link: prefer provided, else fetch from DB or generate short link
    let finalPaymentLink = paymentLink || '';

    // For payment method collection, generate a short link
    if (messageType === 'payment_method_collection' && !finalPaymentLink && customerId) {
      console.log('Generating short link for payment method collection...');
      
      // Generate a short code
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
      let shortCode = '';
      for (let i = 0; i < 6; i++) {
        shortCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      
      // The target URL for payment collection
      const targetUrl = `${supabaseUrl}/functions/v1/redirect-to-payment-collection?customer_id=${customerId}`;
      
      // Insert the short link into the database
      const { error: insertError } = await supabase
        .from('short_links')
        .insert({
          short_code: shortCode,
          target_url: targetUrl,
          link_type: 'payment_collection',
          customer_id: customerId,
          booking_id: bookingId,
        });
      
      if (insertError) {
        console.error('Error creating short link:', insertError);
        // Fall back to full URL
        finalPaymentLink = targetUrl;
      } else {
        finalPaymentLink = `https://account.sncleaningservices.co.uk/b/${shortCode}`;
        console.log('Generated short link:', finalPaymentLink);
      }
    }

    if (messageType === 'invoice' && !finalPaymentLink) {
      // Try bookings.invoice_link
      const { data: bInv } = await supabase
        .from('bookings')
        .select('invoice_link')
        .eq('id', bookingId)
        .maybeSingle();
      if (bInv?.invoice_link) finalPaymentLink = bInv.invoice_link;

      // Try past_bookings.invoice_link
      if (!finalPaymentLink) {
        const { data: pInv } = await supabase
          .from('past_bookings')
          .select('invoice_link')
          .eq('id', bookingId)
          .maybeSingle();
        if (pInv?.invoice_link) finalPaymentLink = pInv.invoice_link;
      }
    }

    // Create message based on type
    let message: string;
    
    // Build booking details string if available
    const bookingDetails = [];
    if (bookingDate) bookingDetails.push(`Date: ${bookingDate}`);
    if (bookingTime) bookingDetails.push(`Time: ${bookingTime}`);
    if (totalHours) bookingDetails.push(`Hours: ${totalHours}`);
    const bookingInfo = bookingDetails.length > 0 ? `\n\nBooking details:\n${bookingDetails.join('\n')}\nCost: £${amount.toFixed(2)}` : '';
    
    if (messageType === 'payment_method_collection') {
      message = `Hi ${customerName}, thank you for booking with SN Cleaning Services. We don't have a payment card on file for your account. Please add one so we can authorize £${amount.toFixed(2)} 48 hours before your cleaning: ${finalPaymentLink}${bookingInfo}\n\nThank you,\nSN Cleaning Team`;
    } else {
      message = finalPaymentLink
        ? `Hi ${customerName}, invoice for £${amount.toFixed(2)} has been sent by email from SN Cleaning Services. If you don't see it, please check the spam folder. You can also pay here: ${finalPaymentLink}\n\nThank you,\nSN Cleaning Team`
        : `Hi ${customerName}, invoice for £${amount.toFixed(2)} has been sent by email from SN Cleaning Services. If you don't see it, please check the spam folder.\n\nThank you,\nSN Cleaning Team`;
    }

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
