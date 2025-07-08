import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestEmailRequest {
  email: string;
  customerName?: string;
  bookingDetails?: {
    service: string;
    date: string;
    address: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, customerName = "Valued Customer", bookingDetails }: TestEmailRequest = await req.json();

    console.log('Sending test email to:', email);
    console.log('Using Resend API key:', Deno.env.get("RESEND_API_KEY") ? 'API key present' : 'API key missing');
    console.log('From email:', "SN Cleaning <noreply@notifications.sncleaningservices.co.uk>");

    const emailResponse = await resend.emails.send({
      from: "SN Cleaning <noreply@notifications.sncleaningservices.co.uk>",
      to: [email, "sales@sncleaningservices.co.uk"],
      reply_to: "sales@sncleaningservices.co.uk",
      subject: `Your Cleaning Photos Are Ready! 📸`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9;">
          <div style="background-color: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; padding: 30px 30px 0 30px;">
              <h1 style="color: #18A5A5; margin: 0; font-size: 28px;">SN Cleaning</h1>
              <p style="color: #185166; margin: 5px 0 0 0; font-size: 14px;">Professional Cleaning Services</p>
            </div>

            <div style="padding: 0 30px 30px 30px;">
              <h2 style="color: #18A5A5; margin-bottom: 20px;">Your Cleaning Photos Are Ready!</h2>
              
              <p>Dear ${customerName},</p>
              
              <p>Great news! Your cleaner has completed the service and uploaded photos showing the excellent work completed at your property.</p>
              
              ${bookingDetails ? `
              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #18A5A5;">
                <h3 style="margin-top: 0; color: #185166;">Service Details:</h3>
                <p style="margin: 5px 0;"><strong>Service:</strong> ${bookingDetails.service}</p>
                <p style="margin: 5px 0;"><strong>Date:</strong> ${bookingDetails.date}</p>
                <p style="margin: 5px 0;"><strong>Address:</strong> ${bookingDetails.address}</p>
              </div>
              ` : ''}
              
              <div style="background-color: #18A5A5; color: white; padding: 20px; border-radius: 8px; margin: 30px 0; text-align: center;">
                <h3 style="margin: 0 0 15px 0;">View Your Cleaning Photos</h3>
                <p style="margin: 0 0 20px 0;">Click the button below to access your before and after photos:</p>
                <a href="https://account.sncleaningservices.co.uk/photos/SE164NF_2025-07-07_29" 
                   style="display: inline-block; background-color: white; color: #18A5A5; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 10px;">
                  📸 View Photos
                </a>
              </div>
              
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0; color: #666; font-size: 14px;">
                  <strong>Note:</strong> These photos showcase the quality of work performed and serve as verification of service completion. 
                  You can access these photos anytime through your customer portal.
                </p>
              </div>
              
              <p>We take pride in our thorough cleaning service and transparency. If you have any questions about the service or would like to schedule your next cleaning, please don't hesitate to contact us.</p>
              
              <p style="margin-top: 30px;">Thank you for choosing SN Cleaning!</p>
              
              <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="color: #18A5A5; font-weight: bold; margin: 0;">SN Cleaning Services</p>
                <p style="color: #666; font-size: 12px; margin: 5px 0;">Professional • Reliable • Trusted</p>
              </div>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
              <p style="color: #666; font-size: 12px; text-align: center;">
                This is an automated notification. Please do not reply to this email.
              </p>
            </div>
          </div>
        </div>
      `,
    });

    console.log("Full Resend API response:", JSON.stringify(emailResponse, null, 2));

    if (emailResponse.error) {
      console.error("Resend API error:", emailResponse.error);
      return new Response(JSON.stringify({ 
        error: `Resend API error: ${emailResponse.error.message}`,
        details: emailResponse.error
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Test email sent successfully',
      email_id: emailResponse.data?.id,
      sent_to: email,
      resend_response: emailResponse
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in send-test-email function:", error);
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