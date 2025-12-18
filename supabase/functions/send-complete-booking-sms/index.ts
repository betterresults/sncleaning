import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CompleteBookingSMSRequest {
  phoneNumber: string;
  customerName: string;
  completeBookingUrl: string;
  totalCost: number;
  estimatedHours: number | null;
  serviceType: string;
  sessionId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phoneNumber, customerName, completeBookingUrl, totalCost, estimatedHours, serviceType, sessionId }: CompleteBookingSMSRequest = await req.json();

    console.log('Sending complete booking SMS to:', phoneNumber);
    console.log('Customer name:', customerName);
    console.log('Total cost:', totalCost, 'Estimated hours:', estimatedHours);
    console.log('Booking URL:', completeBookingUrl);

    // Format phone number for Twilio
    let formattedPhone = phoneNumber.replace(/\s+/g, '').replace(/[^0-9+]/g, '');
    if (!formattedPhone.startsWith('+')) {
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '+44' + formattedPhone.substring(1);
      } else {
        formattedPhone = '+44' + formattedPhone;
      }
    }

    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      throw new Error("Twilio credentials not configured");
    }

    // Build personalized message
    // Check if we have a real customer name (not empty, not just whitespace, not generic)
    const hasRealName = customerName && 
      customerName.trim() && 
      customerName.trim().toLowerCase() !== 'customer' &&
      customerName.trim().toLowerCase() !== 'valued customer';
    
    // Get first name only for greeting
    const firstName = hasRealName ? customerName.split(' ')[0] : '';
    const greeting = firstName ? `Hi ${firstName}! ` : '';
    
    // Format service type for display
    const serviceLabel = serviceType === 'Domestic' ? 'cleaning' : 
                        serviceType === 'Airbnb' ? 'Airbnb cleaning' : 
                        serviceType || 'cleaning';
    
    // Format cost with pound sign
    const costText = totalCost && totalCost > 0 ? ` (£${totalCost.toFixed(2)})` : '';
    
    // Build the message - short URL keeps it under SMS limit
    const message = `${greeting}Your ${serviceLabel} quote${costText} is ready! Complete your booking here: ${completeBookingUrl}`;

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

    console.log("Complete booking SMS sent successfully:", result.sid);

    return new Response(
      JSON.stringify({ success: true, messageSid: result.sid }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-complete-booking-sms function:", error);
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