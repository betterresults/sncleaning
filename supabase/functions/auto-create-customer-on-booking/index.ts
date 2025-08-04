import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AutoCreateCustomerRequest {
  booking_data: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number?: string;
    address?: string;
    postcode?: string;
  };
  send_welcome_email?: boolean;
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

    const { booking_data, send_welcome_email = true }: AutoCreateCustomerRequest = await req.json();

    // Check if customer already exists
    const { data: existingCustomer } = await supabaseAdmin
      .from('customers')
      .select('id, email')
      .eq('email', booking_data.email)
      .single();

    let customer_id: number;
    let isNewCustomer = false;

    if (existingCustomer) {
      customer_id = existingCustomer.id;
    } else {
      // Create new customer
      const { data: newCustomer, error: customerError } = await supabaseAdmin
        .from('customers')
        .insert({
          first_name: booking_data.first_name,
          last_name: booking_data.last_name,
          email: booking_data.email,
          phone: booking_data.phone_number,
          client_status: 'New'
        })
        .select('id')
        .single();

      if (customerError) {
        console.error('Error creating customer:', customerError);
        return new Response(JSON.stringify({ error: customerError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      customer_id = newCustomer.id;
      isNewCustomer = true;
    }

    // Check if user account already exists
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('user_id')
      .eq('customer_id', customer_id)
      .single();

    let user_id: string | null = null;
    let tempPassword: string | null = null;

    if (!existingProfile) {
      // Generate a temporary password
      tempPassword = Math.random().toString(36).slice(-12) + 'A1!';

      // Create user account
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: booking_data.email,
        password: tempPassword,
        user_metadata: {
          first_name: booking_data.first_name,
          last_name: booking_data.last_name,
          role: 'guest'
        },
        email_confirm: false
      });

      if (authError) {
        console.error('Error creating user account:', authError);
        // Don't fail the booking if account creation fails
      } else {
        user_id = authUser.user.id;

        // Update profile with customer_id
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({ customer_id })
          .eq('user_id', user_id);

        if (profileError) {
          console.error('Error updating profile:', profileError);
        }

        // Send welcome email for new customers with accounts
        if (send_welcome_email && isNewCustomer) {
          try {
            await resend.emails.send({
              from: "SN Cleaning Services <admin@sncleaningservices.co.uk>",
              to: [booking_data.email],
              subject: "🎉 Booking Confirmed + Your VIP Account is Ready!",
              html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
                  <!-- Header -->
                  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 300;">Thank You for Choosing Us!</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Your cleaning is in excellent hands</p>
                  </div>
                  
                  <!-- Main Content -->
                  <div style="padding: 40px 30px; background-color: white;">
                    <h2 style="color: #4a5568; margin: 0 0 20px 0; font-size: 24px;">Hello ${booking_data.first_name || 'there'}! 👋</h2>
                    
                    <p style="color: #718096; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                      We're absolutely delighted that you've chosen SN Cleaning Services! Your booking has been received and we're already preparing to make your space sparkle.
                    </p>

                    <!-- Booking Confirmation Box -->
                    <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 25px; border-radius: 12px; margin: 30px 0; text-align: center;">
                      <h3 style="color: white; margin: 0 0 10px 0; font-size: 20px;">✅ Booking Confirmed!</h3>
                      <p style="color: rgba(255,255,255,0.95); margin: 0; font-size: 16px;">
                        We'll contact you soon to confirm all the details and schedule your cleaning.
                      </p>
                    </div>

                    <h3 style="color: #4a5568; margin: 30px 0 20px 0; font-size: 20px;">🎁 Bonus: We've Created Your VIP Account!</h3>
                    
                    <p style="color: #718096; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                      As a valued customer, you now have access to your personal cleaning portal with exclusive features:
                    </p>

                    <!-- Features Box -->
                    <div style="background-color: #f7fafc; padding: 25px; border-radius: 12px; border: 2px solid #e2e8f0; margin: 25px 0;">
                      <ul style="color: #4a5568; margin: 0; padding-left: 20px; line-height: 1.8; font-size: 15px;">
                        <li>📅 <strong>Track Your Bookings:</strong> View past and upcoming cleans</li>
                        <li>📸 <strong>See the Results:</strong> Before & after photos of your cleaning</li>
                        <li>📱 <strong>Easy Rebooking:</strong> Schedule your next clean with one click</li>
                        <li>📋 <strong>Manage Addresses:</strong> Save multiple locations</li>
                        <li>📄 <strong>Digital Receipts:</strong> Download invoices anytime</li>
                        <li>⭐ <strong>Share Feedback:</strong> Let us know how we're doing</li>
                      </ul>
                    </div>

                    <!-- Login Details -->
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; border-radius: 12px; color: white; margin: 30px 0;">
                      <h3 style="color: white; margin: 0 0 15px 0; font-size: 18px;">🔐 Your VIP Access Details</h3>
                      <p style="margin: 8px 0; color: rgba(255,255,255,0.95);"><strong>Email:</strong> ${booking_data.email}</p>
                      <p style="margin: 8px 0; color: rgba(255,255,255,0.95);"><strong>Temporary Password:</strong></p>
                      <div style="background-color: rgba(255,255,255,0.15); color: white; padding: 12px; border-radius: 6px; font-family: 'Courier New', monospace; font-size: 16px; letter-spacing: 1px; margin: 10px 0; border: 1px solid rgba(255,255,255,0.3);">
                        ${tempPassword}
                      </div>
                      <p style="color: #ffd700; font-size: 14px; margin: 15px 0 0 0;">
                        ⚠️ <strong>Security Tip:</strong> Change this password after your first login!
                      </p>
                    </div>

                    <!-- CTA Button -->
                    <div style="text-align: center; margin: 35px 0;">
                      <a href="${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com') || 'https://your-domain.com'}/auth" 
                         style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                        🚀 Access Your VIP Portal
                      </a>
                    </div>

                    <!-- What's Next Box -->
                    <div style="background-color: #e6fffa; padding: 20px; border-radius: 8px; border-left: 4px solid #38b2ac; margin: 25px 0;">
                      <h4 style="color: #234e52; margin: 0 0 10px 0; font-size: 16px;">🔮 What Happens Next?</h4>
                      <p style="color: #234e52; margin: 0; line-height: 1.6; font-size: 15px;">
                        Our team will contact you within 24 hours to confirm your booking details and schedule. After each cleaning, you'll receive stunning before & after photos through your portal!
                      </p>
                    </div>

                    <p style="color: #718096; font-size: 16px; line-height: 1.6; margin-top: 30px;">
                      Have questions? We're here to help! Simply reply to this email or give us a call. Our friendly team loves hearing from customers.
                    </p>
                    
                    <p style="color: #4a5568; font-size: 16px; margin-top: 25px;">
                      Thank you for trusting us with your space! 🌟<br>
                      <span style="color: #667eea; font-weight: 500;">The SN Cleaning Services Team</span>
                    </p>
                  </div>
                  
                  <!-- Footer -->
                  <div style="background-color: #4a5568; padding: 20px; text-align: center; color: #a0aec0; font-size: 14px;">
                    <p style="margin: 0;">SN Cleaning Services - Making your space sparkle since day one! ✨</p>
                    <p style="margin: 5px 0 0 0;">Professional • Reliable • Customer-Focused</p>
                  </div>
                </div>
              `,
            });
          } catch (emailError) {
            console.error('Error sending welcome email:', emailError);
          }
        }
      }
    } else {
      user_id = existingProfile.user_id;
    }

    return new Response(JSON.stringify({
      success: true,
      customer_id,
      user_id,
      is_new_customer: isNewCustomer,
      account_created: !existingProfile,
      temp_password: tempPassword
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in auto-create-customer-on-booking function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

serve(handler);