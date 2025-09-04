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

    // Send custom branded email with enhanced anti-spam design
    const emailResult = await resend.emails.send({
      from: "SN Cleaning Services <noreply@sncleaningservices.co.uk>",
      to: [email],
      subject: `Password Reset Request - ${customer_name ? customer_name + ', ' : ''}Your SN Cleaning Account`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset - SN Cleaning Services</title>
          <!--[if mso]>
          <noscript>
            <xml>
              <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
              </o:OfficeDocumentSettings>
            </xml>
          </noscript>
          <![endif]-->
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          
          <!-- Email Container -->
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc;">
            <tr>
              <td align="center" style="padding: 20px 0;">
                
                <!-- Main Email Container -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">SN Cleaning Services</h1>
                      <p style="color: rgba(255,255,255,0.95); margin: 12px 0 0 0; font-size: 18px; font-weight: 500;">Secure Password Reset</p>
                      <div style="width: 60px; height: 4px; background-color: rgba(255,255,255,0.3); margin: 20px auto 0; border-radius: 2px;"></div>
                    </td>
                  </tr>
                  
                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 50px 40px;">
                      
                      <!-- Personal Greeting -->
                      <h2 style="color: #1f2937; margin: 0 0 24px 0; font-size: 26px; font-weight: 600;">
                        Hello ${customer_name ? customer_name : 'Valued Customer'}! 👋
                      </h2>
                      
                      <!-- Main Message -->
                      <p style="color: #374151; font-size: 18px; line-height: 1.7; margin-bottom: 28px; font-weight: 400;">
                        We received a request to reset the password for your SN Cleaning Services account associated with <strong>${email}</strong>. 
                      </p>

                      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
                        This is an automated security message from our trusted system to help you quickly regain access to your account and continue managing your cleaning services with confidence.
                      </p>

                      <!-- Security Notice -->
                      <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-left: 4px solid #0ea5e9; padding: 24px; border-radius: 6px; margin: 32px 0;">
                        <div style="display: flex; align-items: center; margin-bottom: 12px;">
                          <span style="font-size: 20px; margin-right: 8px;">🔒</span>
                          <strong style="color: #0c4a6e; font-size: 16px;">Security Information</strong>
                        </div>
                        <p style="margin: 0; color: #0c4a6e; font-size: 15px; line-height: 1.5;">
                          This secure reset link expires in <strong>60 minutes</strong> and can only be used once. 
                          If you didn't request this password reset, you can safely ignore this email - your account remains secure.
                        </p>
                      </div>

                      <!-- Reset Button -->
                      <div style="text-align: center; margin: 40px 0;">
                        <a href="${data.properties?.action_link}" 
                           style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); 
                                  color: #ffffff; 
                                  padding: 18px 36px; 
                                  text-decoration: none; 
                                  border-radius: 10px; 
                                  display: inline-block; 
                                  font-weight: 600; 
                                  font-size: 18px; 
                                  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
                                  transition: all 0.3s ease;
                                  border: 2px solid transparent;">
                          🔐 Reset My Password Securely
                        </a>
                      </div>

                      <!-- Alternative Access -->
                      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 24px; border-radius: 8px; margin: 32px 0;">
                        <h3 style="color: #374151; font-size: 16px; margin: 0 0 12px 0; font-weight: 600;">
                          Can't click the button? No problem!
                        </h3>
                        <p style="color: #64748b; font-size: 14px; margin: 0 0 12px 0;">
                          Copy and paste this secure link into your web browser:
                        </p>
                        <div style="background-color: #ffffff; padding: 12px; border-radius: 6px; border: 1px solid #cbd5e1; word-break: break-all;">
                          <code style="color: #1e40af; font-size: 13px; font-family: 'Monaco', 'Menlo', monospace;">
                            ${data.properties?.action_link}
                          </code>
                        </div>
                      </div>

                      <!-- Instructions -->
                      <div style="margin: 32px 0;">
                        <h3 style="color: #1f2937; font-size: 18px; margin: 0 0 16px 0; font-weight: 600;">What happens next?</h3>
                        <ol style="color: #4b5563; font-size: 16px; line-height: 1.6; padding-left: 20px;">
                          <li style="margin-bottom: 8px;">Click the secure reset button above</li>
                          <li style="margin-bottom: 8px;">You'll be taken to our protected password reset page</li>
                          <li style="margin-bottom: 8px;">Create a strong, new password for your account</li>
                          <li>Sign in with your new password and continue using our services</li>
                        </ol>
                      </div>

                      <!-- Support Information -->
                      <div style="background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%); border-left: 4px solid #f59e0b; padding: 24px; border-radius: 6px; margin: 32px 0;">
                        <h3 style="color: #92400e; font-size: 16px; margin: 0 0 12px 0; font-weight: 600;">
                          Need Help? We're Here for You! 🤝
                        </h3>
                        <p style="color: #92400e; font-size: 15px; line-height: 1.6; margin: 0;">
                          If you're experiencing any issues or have questions about your account, our friendly support team is ready to assist you. 
                          Contact us at <a href="mailto:support@sncleaningservices.co.uk" style="color: #1d4ed8; text-decoration: none; font-weight: 600;">support@sncleaningservices.co.uk</a>
                        </p>
                      </div>

                      <!-- Personal Touch -->
                      <p style="color: #1f2937; font-size: 16px; line-height: 1.6; margin-top: 32px;">
                        Thank you for choosing SN Cleaning Services. We appreciate your trust in our professional cleaning solutions and look forward to continuing to serve you.
                      </p>
                      
                      <div style="margin-top: 32px;">
                        <p style="color: #2563eb; font-size: 16px; margin: 0; font-weight: 600;">
                          Best regards,<br>
                          The SN Cleaning Services Team
                        </p>
                      </div>

                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #1f2937; padding: 30px 40px; text-align: center; border-radius: 0 0 8px 8px;">
                      <h3 style="color: #ffffff; margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">SN Cleaning Services</h3>
                      <p style="color: #9ca3af; margin: 0 0 16px 0; font-size: 14px;">
                        Professional Cleaning Solutions | Trusted Service Provider<br>
                        Serving customers with excellence and reliability
                      </p>
                      
                      <!-- Contact Information -->
                      <div style="border-top: 1px solid #374151; padding-top: 16px; margin-top: 16px;">
                        <p style="color: #6b7280; font-size: 13px; margin: 0 0 8px 0;">
                          📧 Email: <a href="mailto:info@sncleaningservices.co.uk" style="color: #60a5fa; text-decoration: none;">info@sncleaningservices.co.uk</a>
                        </p>
                        <p style="color: #6b7280; font-size: 13px; margin: 0;">
                          This email was sent to ${email} because a password reset was requested for your account.
                        </p>
                      </div>
                      
                      <!-- Legal -->
                      <div style="border-top: 1px solid #374151; padding-top: 16px; margin-top: 16px;">
                        <p style="color: #6b7280; font-size: 12px; margin: 0; line-height: 1.4;">
                          © ${new Date().getFullYear()} SN Cleaning Services. All rights reserved.<br>
                          This is an automated security email. Please do not reply to this message.
                        </p>
                      </div>
                      
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