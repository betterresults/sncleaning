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

    const { email }: PasswordResetRequest = await req.json();

    // Generate password reset
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com') || 'https://your-domain.com'}/auth`
    });

    if (error) {
      console.error('Error sending password reset:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Send custom branded email
    try {
      await resend.emails.send({
        from: "SN Cleaning Services <admin@sncleaningservices.co.uk>",
        to: [email],
        subject: "🔐 Reset Your SN Cleaning Services Password",
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 300;">Password Reset Request</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">SN Cleaning Services</p>
            </div>
            
            <!-- Main Content -->
            <div style="padding: 40px 30px; background-color: white;">
              <h2 style="color: #4a5568; margin: 0 0 20px 0; font-size: 24px;">Hello! 👋</h2>
              
              <p style="color: #718096; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                We received a request to reset your password for your SN Cleaning Services account. No worries - it happens to the best of us!
              </p>

              <!-- Security Notice -->
              <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 25px 0;">
                <h4 style="color: #856404; margin: 0 0 10px 0; font-size: 16px;">🔒 Security Notice</h4>
                <p style="color: #856404; margin: 0; line-height: 1.6; font-size: 14px;">
                  If you didn't request this password reset, you can safely ignore this email. Your account security is not compromised.
                </p>
              </div>

              <!-- Reset Instructions -->
              <div style="background-color: #e6fffa; padding: 25px; border-radius: 12px; border-left: 4px solid #38b2ac; margin: 30px 0;">
                <h3 style="color: #234e52; margin: 0 0 15px 0; font-size: 18px;">📝 Reset Instructions</h3>
                <ol style="color: #234e52; margin: 0; padding-left: 20px; line-height: 1.8;">
                  <li>Click the reset button below</li>
                  <li>You'll be taken to a secure page</li>
                  <li>Enter your new password</li>
                  <li>Start using your account right away!</li>
                </ol>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 35px 0;">
                <a href="${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com') || 'https://your-domain.com'}/auth" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                  🔐 Reset My Password
                </a>
              </div>

              <!-- Expiry Notice -->
              <div style="background-color: #f7fafc; padding: 15px; border-radius: 6px; margin: 25px 0; text-align: center;">
                <p style="color: #4a5568; margin: 0; font-size: 14px;">
                  ⏰ This reset link will expire in 24 hours for your security.
                </p>
              </div>

              <p style="color: #718096; font-size: 16px; line-height: 1.6; margin-top: 30px;">
                Need help? Our friendly support team is here for you! Just reply to this email and we'll get back to you quickly.
              </p>
              
              <p style="color: #4a5568; font-size: 16px; margin-top: 25px;">
                Stay secure! 🔒<br>
                <span style="color: #667eea; font-weight: 500;">The SN Cleaning Services Team</span>
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #4a5568; padding: 20px; text-align: center; color: #a0aec0; font-size: 14px;">
              <p style="margin: 0;">SN Cleaning Services - Your trusted cleaning partner! ✨</p>
              <p style="margin: 5px 0 0 0;">Professional • Reliable • Secure</p>
            </div>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Error sending custom reset email:', emailError);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Password reset email sent successfully!'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in password-reset-email function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

serve(handler);