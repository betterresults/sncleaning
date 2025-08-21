import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PasswordResetRequest {
  email: string;
  customer_name?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { email, customer_name }: PasswordResetRequest = await req.json();

    console.log(`Sending password reset email to: ${email}`);

    if (!Deno.env.get("RESEND_API_KEY")) {
      console.error("RESEND_API_KEY is not set");
      throw new Error("Email service not configured");
    }

    // Generate a password reset link using Supabase
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com') || 'https://your-domain.com'}/auth`
      }
    });

    if (error) {
      console.error('Error generating reset link:', error);
      throw error;
    }

    // Send custom branded email
    const emailResult = await resend.emails.send({
      from: "SN Cleaning Services <admin@sncleaningservices.co.uk>",
      to: [email],
      subject: "Reset Your SN Cleaning Services Password - Secure Access",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">SN Cleaning Services</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Secure Password Reset</p>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 40px 30px; background-color: white;">
            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Hello ${customer_name || 'there'}!</h2>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
              We received a request to reset your password for your SN Cleaning Services account. This is a secure, automated message to help you regain access to your account.
            </p>

            <!-- Information Notice -->
            <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <p style="margin: 0; color: #1e40af; font-size: 14px;">
                <strong>Information:</strong> This secure link will expire in 60 minutes for your account security. If you didn't request this password reset, please disregard this email - no action is required.
              </p>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 35px 0;">
              <a href="${data.properties?.action_link}" 
                 style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);">
                Reset Password Securely
              </a>
            </div>

            <!-- Alternative Link -->
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #e5e7eb;">
              <p style="color: #374151; font-size: 14px; margin: 0 0 10px 0;">
                Alternative: Copy and paste this secure link into your browser:
              </p>
              <p style="word-break: break-all; color: #2563eb; font-size: 12px; margin: 0; background-color: white; padding: 8px; border-radius: 4px;">
                ${data.properties?.action_link}
              </p>
            </div>

            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-top: 30px;">
              After clicking the secure link above, you'll be directed to a protected page where you can set a new password. We recommend choosing a strong, unique password to maintain account security.
            </p>
            
            <p style="color: #1f2937; font-size: 16px; margin-top: 25px;">
              Need assistance? Our support team is available to help.<br>
              <span style="color: #2563eb; font-weight: 500;">SN Cleaning Services Support Team</span>
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #374151; padding: 20px; text-align: center; color: #9ca3af; font-size: 14px;">
            <p style="margin: 0;">SN Cleaning Services</p>
            <p style="margin: 5px 0 0 0;">Professional Cleaning Solutions | Trusted Service Provider</p>
          </div>
        </div>
      `,
    });

    console.log('Password reset email sent successfully:', emailResult);

    return new Response(JSON.stringify({
      success: true,
      message: 'Password reset email sent successfully'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in send-password-reset function:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

serve(handler);