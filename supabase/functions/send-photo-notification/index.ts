import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PhotoNotificationRequest {
  booking_id: number;
  customer_email: string;
  customer_name: string;
  service_type: string;
  booking_date: string;
  photo_count: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { booking_id, customer_email, customer_name, service_type, booking_date, photo_count }: PhotoNotificationRequest = await req.json();

    console.log('Processing photo notification for booking:', booking_id);

    // Check if notification already sent for this booking
    const { data: existingNotification } = await supabase
      .from('photo_completion_notifications')
      .select('*')
      .eq('booking_id', booking_id)
      .eq('email_sent', true)
      .single();

    if (existingNotification) {
      console.log('Email already sent for booking:', booking_id);
      return new Response(JSON.stringify({ message: 'Email already sent' }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Send email notification
    const emailResponse = await resend.emails.send({
      from: "SN Cleaning <notifications@sncleaning.com>",
      to: [customer_email],
      subject: `Your cleaning photos are ready - ${service_type}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #18A5A5;">Your Cleaning Photos Are Ready!</h2>
          
          <p>Dear ${customer_name},</p>
          
          <p>Great news! Your cleaner has completed the ${service_type} service and uploaded ${photo_count} photos showing the work completed.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #185166;">Booking Details:</h3>
            <p><strong>Service:</strong> ${service_type}</p>
            <p><strong>Date:</strong> ${new Date(booking_date).toLocaleDateString()}</p>
            <p><strong>Photos:</strong> ${photo_count} uploaded</p>
          </div>
          
          <p>You can view these photos by logging into your account or contact us if you need any assistance.</p>
          
          <p>Thank you for choosing SN Cleaning!</p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            This is an automated notification. Please do not reply to this email.
          </p>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    // Record the notification
    await supabase
      .from('photo_completion_notifications')
      .insert({
        booking_id,
        email_sent: true,
        notification_sent_at: new Date().toISOString()
      });

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Email notification sent successfully',
      email_id: emailResponse.data?.id 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in send-photo-notification function:", error);
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