import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CompleteBookingEmailRequest {
  email: string;
  customerName: string;
  completeBookingUrl: string;
  quoteData: {
    totalCost: number;
    estimatedHours: number | null;
    serviceType: string;
  };
  sessionId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, customerName, completeBookingUrl, quoteData, sessionId }: CompleteBookingEmailRequest = await req.json();

    console.log('Sending complete booking email to:', email);
    console.log('Complete booking URL:', completeBookingUrl);

    const emailResponse = await resend.emails.send({
      from: "SN Cleaning <bookings@sncleaningservices.co.uk>",
      to: [email],
      subject: "Complete Your Cleaning Booking",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Complete Your Booking</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
          <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="background-color: #f5f5f5;">
            <tr>
              <td style="padding: 40px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #18A5A5, #185166); padding: 40px 30px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Complete Your Booking</h1>
                      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Just a few more details needed</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                        Hi ${customerName},
                      </p>
                      <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                        We've prepared your ${quoteData.serviceType || 'cleaning'} booking with all the details you discussed with us. Click the button below to review and complete your booking.
                      </p>
                      
                      ${quoteData.totalCost > 0 ? `
                      <!-- Quote Summary -->
                      <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="background-color: #f8f9fa; border-radius: 12px; margin: 25px 0;">
                        <tr>
                          <td style="padding: 20px;">
                            <p style="color: #666; font-size: 14px; margin: 0 0 10px; font-weight: 600;">Your Quote Summary</p>
                            <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                              <tr>
                                <td style="color: #333; font-size: 24px; font-weight: 700;">£${quoteData.totalCost.toFixed(2)}</td>
                                ${quoteData.estimatedHours ? `<td style="color: #666; font-size: 14px; text-align: right;">${quoteData.estimatedHours} hours</td>` : ''}
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      ` : ''}
                      
                      <!-- CTA Button -->
                      <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="margin: 30px 0;">
                        <tr>
                          <td style="text-align: center;">
                            <a href="${completeBookingUrl}" style="display: inline-block; background: linear-gradient(135deg, #18A5A5, #185166); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(24, 165, 165, 0.3);">
                              Complete Your Booking
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="color: #888; font-size: 14px; line-height: 1.6; margin: 20px 0 0; text-align: center;">
                        All your details are already filled in - just review and confirm!
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #eee;">
                      <p style="color: #999; font-size: 12px; margin: 0;">
                        SN Cleaning Services | Professional Cleaning You Can Trust
                      </p>
                      <p style="color: #bbb; font-size: 11px; margin: 10px 0 0;">
                        If you didn't request this email, please ignore it.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    console.log("Complete booking email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-complete-booking-email function:", error);
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