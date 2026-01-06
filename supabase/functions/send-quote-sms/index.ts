import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface QuoteSMSRequest {
  phoneNumber: string;
  customerName: string;
  totalCost: number;
  serviceType: string;
  postcode?: string;
  quoteUrl?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phoneNumber, customerName, totalCost, serviceType, postcode, quoteUrl }: QuoteSMSRequest = await req.json();

    console.log('Sending quote SMS to:', phoneNumber);
    console.log('Customer name:', customerName);
    console.log('Total cost:', totalCost);
    console.log('Service type:', serviceType);
    console.log('Postcode:', postcode);
    console.log('Quote URL:', quoteUrl);

    // Format phone number for Twilio
    let formattedPhone = phoneNumber.replace(/\s+/g, '').replace(/[^0-9+]/g, '');
    
    // Handle various phone number formats
    if (formattedPhone.startsWith('+44')) {
      // Already has UK country code - keep as is
    } else if (formattedPhone.startsWith('44') && !formattedPhone.startsWith('+')) {
      // Has 44 without + prefix
      formattedPhone = '+' + formattedPhone;
    } else if (formattedPhone.startsWith('0')) {
      // UK local format starting with 0
      formattedPhone = '+44' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('+')) {
      // Just digits, assume UK
      formattedPhone = '+44' + formattedPhone;
    }
    
    console.log('Formatted phone number:', formattedPhone);

    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      throw new Error("Twilio credentials not configured");
    }

    // Format service type for display
    const serviceLabel = serviceType === 'Domestic' ? 'domestic cleaning' : 
                        serviceType === 'Airbnb' ? 'Airbnb cleaning' : 
                        serviceType === 'Carpet Cleaning' ? 'carpet cleaning' :
                        'cleaning';
    
    // Format cost
    const costText = totalCost && totalCost > 0 ? `£${totalCost.toFixed(2)}` : '';
    
    // Build location text if postcode available
    const locationText = postcode ? ` for ${postcode}` : '';
    
    // Get first name for greeting
    const firstName = customerName ? customerName.split(' ')[0] : '';
    const greeting = firstName ? `Hi ${firstName}, thank you for choosing SN Cleaning! ` : 'Thank you for choosing SN Cleaning! ';
    
    // Build friendly message - include link if available
    let message: string;
    if (quoteUrl) {
      message = `${greeting}Your ${serviceLabel} quote${locationText} is ${costText}. Review and book here: ${quoteUrl}`;
    } else {
      message = `${greeting}Your ${serviceLabel} quote${locationText} is ${costText}. Call us on 0203 576 6888 to book or reply to this message for more info.`;
    }

    console.log('SMS Message:', message);
    console.log('Message length:', message.length);

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
        },
        body: new URLSearchParams({
          To: formattedPhone,
          From: twilioPhoneNumber,
          Body: message,
        }).toString(),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Twilio error:", result);
      throw new Error(result.message || "Failed to send SMS");
    }

    console.log("Quote SMS sent successfully:", result.sid);

    // Log SMS to notification_logs table
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const { error: logError } = await supabase
        .from('notification_logs')
        .insert({
          recipient_email: formattedPhone, // Using recipient_email field for phone number
          recipient_type: 'customer',
          subject: `Quote SMS - ${serviceType}`,
          content: message,
          notification_type: 'sms',
          status: 'sent',
          delivery_id: result.sid,
          sent_at: new Date().toISOString(),
        });

      if (logError) {
        console.error('Failed to log SMS notification:', logError);
      } else {
        console.log('SMS notification logged successfully');
      }
    } catch (logErr) {
      console.error('Error logging SMS notification:', logErr);
    }

    return new Response(
      JSON.stringify({ success: true, messageSid: result.sid }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-quote-sms function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
