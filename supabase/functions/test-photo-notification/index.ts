import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestNotificationRequest {
  email: string;
  booking_id?: number;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Test notification function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, booking_id }: TestNotificationRequest = await req.json();
    
    console.log("Sending test notification to:", email);

    const emailResponse = await resend.emails.send({
      from: "SN Cleaning <onboarding@resend.dev>",
      to: [email],
      subject: "🧹 Your Cleaning Photos are Ready!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #185166; text-align: center;">Your Cleaning Photos are Ready! 📸</h1>
          
          <p>Great news! Your cleaner has uploaded photos from your recent cleaning service.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #18A5A5; margin-top: 0;">What's included:</h3>
            <ul>
              <li>✅ Before and after photos</li>
              <li>📝 Any additional notes or observations</li>
              <li>💾 High-quality images you can download</li>
            </ul>
          </div>

          ${booking_id ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${Deno.env.get('SUPABASE_URL')?.replace('https://', 'https://').replace('.supabase.co', '.supabase.co')}/photos/test_${booking_id}" 
               style="background: #18A5A5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              📷 View Your Photos
            </a>
          </div>
          ` : ''}

          <p style="color: #666; font-size: 14px; text-align: center; margin-top: 40px;">
            This is a test notification from SN Cleaning photo system.
          </p>
        </div>
      `,
    });

    console.log("Test email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Test notification sent successfully",
      email_response: emailResponse 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in test notification function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);