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
      subject: "🔐 Reset Your SN Cleaning Services Password",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 300;">SN Cleaning Services</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Password Reset Request</p>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 40px 30px; background-color: white;">
            <h2 style="color: #4a5568; margin: 0 0 20px 0; font-size: 24px;">Hello ${customer_name || 'there'}! 👋</h2>
            
            <p style="color: #718096; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
              We received a request to reset your password for your SN Cleaning Services account. If you made this request, please click the button below to create a new password.
            </p>

            <!-- Security Notice -->
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                🔒 <strong>Security Notice:</strong> This link will expire in 1 hour for your security. If you didn't request this password reset, please ignore this email.
              </p>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 35px 0;">
              <a href="${data.properties?.action_link}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); transition: all 0.3s ease;">
                🔐 Reset My Password
              </a>
            </div>

            <!-- Alternative Link -->
            <div style="background-color: #edf2f7; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <p style="color: #4a5568; font-size: 14px; margin: 0 0 10px 0;">
                If the button above doesn't work, copy and paste this link into your browser:
              </p>
              <p style="word-break: break-all; color: #667eea; font-size: 12px; margin: 0;">
                ${data.properties?.action_link}
              </p>
            </div>

            <p style="color: #718096; font-size: 16px; line-height: 1.6; margin-top: 30px;">
              After clicking the link, you'll be taken to a secure page where you can create your new password. Make sure to choose a strong password to keep your account secure.
            </p>
            
            <p style="color: #4a5568; font-size: 16px; margin-top: 25px;">
              If you have any questions or need assistance, our friendly team is here to help! 🌟<br>
              <span style="color: #667eea; font-weight: 500;">The SN Cleaning Team</span>
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #4a5568; padding: 20px; text-align: center; color: #a0aec0; font-size: 14px;">
            <p style="margin: 0;">SN Cleaning Services - Making your home sparkle! ✨</p>
            <p style="margin: 5px 0 0 0;">Professional • Reliable • Trusted</p>
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